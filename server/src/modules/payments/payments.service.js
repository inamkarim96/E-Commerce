const { db } = require("../../config/db");
const ApiError = require("../../utils/apiError");
const jazzcashService = require("./jazzcash.service");
const stripeService = require("./stripe.service");
const sgMail = require("@sendgrid/mail");
const { SENDGRID_API_KEY, SENDGRID_FROM_EMAIL } = require("../../config/env");

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

function sendEmailAsync({ to, subject, text, html }) {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL || !to) return;
  sgMail
    .send({ to, from: SENDGRID_FROM_EMAIL, subject, text, html })
    .catch((error) => console.error("Email send failed:", error?.message || error));
}

async function initiatePayment(userId, { order_id, gateway }) {
  return db.transaction(async (trx) => {
    const order = await trx("orders as o")
      .join("users as u", "o.user_id", "u.id")
      .leftJoin("payments as p", "o.id", "p.order_id")
      .where("o.id", order_id)
      .select(
        "o.*",
        "u.email as user_email",
        "p.id as payment_id",
        "p.status as payment_status"
      )
      .first();

    if (!order) {
      throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
    }

    if (order.user_id !== userId) {
      throw new ApiError(403, "Not authorized to access this order", "FORBIDDEN");
    }

    if (order.status !== "pending") {
      throw new ApiError(400, "Order is not in pending status", "INVALID_ORDER_STATE");
    }

    if (order.payment_status && order.payment_status !== "pending" && order.payment_status !== "failed") {
      throw new ApiError(400, "Payment is already processed or in progress", "INVALID_PAYMENT_STATE");
    }

    let payment_id = order.payment_id;
    if (!payment_id) {
      const [newPayment] = await trx("payments")
        .insert({
          order_id: order.id,
          gateway,
          amount: order.total,
          status: "pending"
        })
        .returning("id");
      payment_id = newPayment.id;
    } else {
      await trx("payments")
        .where({ id: payment_id })
        .update({
          gateway,
          amount: order.total,
          status: "pending",
          updated_at: trx.fn.now()
        });
    }

    if (gateway === "cod") {
      // For COD, payment stays pending until actual delivery, but order is confirmed
      await trx("orders").where({ id: order.id }).update({
        status: "processing",
        updated_at: trx.fn.now()
      });
      return { success: true, message: "Order placed successfully with Cash on Delivery." };
    }

    if (gateway === "jazzcash" || gateway === "easypaisa") {
      // JazzCash handles Easypaisa as well via wallet
      const response = await jazzcashService.initiateJazzcashPayment(order);
      const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      return { payment_url: null, jazzcash_response: response, expires_at };
    }

    if (gateway === "stripe") {
      const { client_secret, payment_url } = await stripeService.createPaymentIntent(order);
      return { client_secret, payment_url };
    }

    throw new ApiError(400, "Unsupported gateway", "INVALID_GATEWAY");
  });
}

async function handleJazzcashWebhook(data) {
  if (!jazzcashService.verifyHash(data)) {
    throw new ApiError(400, "Invalid signature", "INVALID_SIGNATURE");
  }

  const billRef = data.pp_BillReference; // e.g., "order_123"
  const orderIdStr = billRef ? billRef.replace("order_", "") : "";
  const orderId = orderIdStr;

  if (!orderId) {
    throw new ApiError(400, "Invalid order reference", "INVALID_DATA");
  }

  return db.transaction(async (trx) => {
    const order = await trx("orders as o")
      .join("users as u", "o.user_id", "u.id")
      .where("o.id", orderId)
      .select("o.*", "u.email as user_email")
      .first();

    if (!order) {
      throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
    }

    const payment = await trx("payments").where({ order_id: order.id }).first();
    if (!payment || payment.status === "completed") {
      return { success: true }; // Already processed
    }

    // Verify amount match
    const paidAmount = Number(data.pp_Amount) / 100; // convert back from paisa
    if (Math.abs(Number(order.total) - paidAmount) > 0.01) {
      throw new ApiError(400, "Amount mismatch", "AMOUNT_MISMATCH");
    }

    const isSuccess = data.pp_ResponseCode === "000" || data.pp_ResponseCode === "121";
    const status = isSuccess ? "completed" : "failed";

    await trx("payments").where({ id: payment.id }).update({
      status,
      transaction_id: data.pp_TxnRefNo || null,
      gateway_resp: JSON.stringify(data),
      paid_at: isSuccess ? trx.fn.now() : null,
      updated_at: trx.fn.now()
    });

    if (isSuccess && order.status === "pending") {
      await trx("orders").where({ id: order.id }).update({
        status: "processing",
        updated_at: trx.fn.now()
      });

      sendEmailAsync({
        to: order.user_email,
        subject: `Payment Successful - Order #${order.id}`,
        text: `Your payment for order #${order.id} was successful. We are now processing your order.`,
        html: `<p>Your payment for order <strong>#${order.id}</strong> was successful.</p><p>We are now processing your order.</p>`
      });
    }
    
    return { success: true };
  });
}

async function handleStripeWebhook(event) {
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.order_id;
    
    if (!orderId) return { success: true }; // No order ID to attach to, maybe ignore

    await db.transaction(async (trx) => {
      const order = await trx("orders as o")
        .join("users as u", "o.user_id", "u.id")
        .where("o.id", orderId)
        .select("o.*", "u.email as user_email")
        .first();

      if (!order) return;

      const payment = await trx("payments").where({ order_id: orderId }).first();
      if (!payment) return;

      const paidAmount = paymentIntent.amount / 100;
      if (Math.abs(Number(order.total) - paidAmount) > 0.01) {
        // Log mismatch but we probably shouldn't crash
        console.warn(`Amount mismatch for order ${orderId}: Expected ${order.total}, paid ${paidAmount}`);
      }

      await trx("payments").where({ id: payment.id }).update({
        status: "completed",
        transaction_id: paymentIntent.id,
        gateway_resp: JSON.stringify(paymentIntent),
        paid_at: trx.fn.now(),
        updated_at: trx.fn.now()
      });

      if (order.status === "pending") {
        await trx("orders").where({ id: order.id }).update({
          status: "processing",
          updated_at: trx.fn.now()
        });

        sendEmailAsync({
          to: order.user_email,
          subject: `Payment Successful - Order #${order.id}`,
          text: `Your payment for order #${order.id} was successful. We are now processing your order.`,
          html: `<p>Your payment for order <strong>#${order.id}</strong> was successful.</p><p>We are now processing your order.</p>`
        });
      }
    });
  } else if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.order_id;
    
    if (!orderId) return { success: true };

    await db("payments").where({ order_id: orderId }).update({
      status: "failed",
      gateway_resp: JSON.stringify(paymentIntent),
      updated_at: db.fn.now()
    });
  }

  return { success: true };
}

async function getPaymentStatus(userId, orderId) {
  const order = await db("orders").where({ id: orderId }).first();
  if (!order) {
    throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
  }

  if (order.user_id !== userId) {
    throw new ApiError(403, "Not authorized", "FORBIDDEN");
  }

  const payment = await db("payments").where({ order_id: orderId }).first();
  if (!payment) {
    throw new ApiError(404, "Payment not found", "PAYMENT_NOT_FOUND");
  }

  return {
    order_id: order.id,
    order_status: order.status,
    payment_status: payment.status,
    payment_method: payment.gateway,
    transaction_id: payment.transaction_id,
    paid_at: payment.paid_at
  };
}

async function adminRefund(orderId) {
  return db.transaction(async (trx) => {
    const payment = await trx("payments").where({ order_id: orderId }).first();
    
    if (!payment) {
      throw new ApiError(404, "Payment not found", "PAYMENT_NOT_FOUND");
    }

    if (payment.status !== "completed") {
      throw new ApiError(400, "Only completed payments can be refunded", "INVALID_PAYMENT_STATE");
    }

    // In a real scenario, you would call Stripe or JazzCash API to process the refund here.
    // For now, we update the local records.

    await trx("payments").where({ id: payment.id }).update({
      status: "refunded",
      updated_at: trx.fn.now()
    });

    await trx("orders").where({ id: orderId }).update({
      status: "cancelled", // or 'refunded' if that exists in STATUS_TRANSITIONS
      updated_at: trx.fn.now()
    });

    return { success: true, message: "Payment refunded successfully" };
  });
}

// handleJazzcashCallback processes the POST redirect from the JazzCash portal
// after the user completes (or abandons) the payment flow.
async function handleJazzcashCallback(data) {
  // Verify hash integrity
  const isValid = jazzcashService.verifyHash(data);
  if (!isValid) {
    return { success: false, redirect: "/payment/failed?reason=invalid_signature" };
  }

  const billRef = data.pp_BillReference;
  const orderIdStr = billRef ? billRef.replace("order_", "") : "";
  const orderId = orderIdStr;

  if (!orderId) {
    return { success: false, redirect: "/payment/failed?reason=invalid_ref" };
  }

  const isSuccess = data.pp_ResponseCode === "000" || data.pp_ResponseCode === "121";

  try {
    await db.transaction(async (trx) => {
      const order = await trx("orders as o")
        .join("users as u", "o.user_id", "u.id")
        .where("o.id", orderId)
        .select("o.*", "u.email as user_email")
        .first();

      if (!order) return; // Silently skip if already processed

      const payment = await trx("payments").where({ order_id: order.id }).first();
      if (!payment || payment.status === "completed") return; // Idempotency guard

      const status = isSuccess ? "completed" : "failed";

      await trx("payments").where({ id: payment.id }).update({
        status,
        transaction_id: data.pp_TxnRefNo || null,
        gateway_resp: JSON.stringify(data),
        paid_at: isSuccess ? trx.fn.now() : null,
        updated_at: trx.fn.now()
      });

      if (isSuccess && order.status === "pending") {
        await trx("orders").where({ id: order.id }).update({
          status: "processing",
          updated_at: trx.fn.now()
        });

        sendEmailAsync({
          to: order.user_email,
          subject: `Payment Successful - Order #${order.id}`,
          text: `Your payment for order #${order.id} was successful. We are now processing your order.`,
          html: `<p>Your payment for order <strong>#${order.id}</strong> was successful.</p><p>We are now processing your order.</p>`
        });
      }
    });
  } catch (err) {
    console.error("JazzCash callback processing error:", err.message);
  }

  if (isSuccess) {
    return { redirect: `/order-confirmation?order_id=${orderId}&via=jazzcash` };
  }
  return { redirect: `/payment/failed?order_id=${orderId}&code=${data.pp_ResponseCode || "unknown"}` };
}

module.exports = {
  initiatePayment,
  handleJazzcashWebhook,
  handleJazzcashCallback,
  handleStripeWebhook,
  getPaymentStatus,
  adminRefund
};
