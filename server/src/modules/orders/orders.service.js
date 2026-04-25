const sgMail = require("@sendgrid/mail");
const { db } = require("../../config/db");
const ApiError = require("../../utils/apiError");
const { SENDGRID_API_KEY, SENDGRID_FROM_EMAIL } = require("../../config/env");

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const STATUS_TRANSITIONS = {
  pending: ["processing", "cancelled"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: []
};

function toNumber(value) {
  return Number(value || 0);
}

function buildPaymentUrl(orderId, paymentMethod) {
  return `/payments/${paymentMethod}/${orderId}`;
}

function sendOrderEmailAsync({ to, subject, text, html }) {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL || !to) return;
  sgMail
    .send({ to, from: SENDGRID_FROM_EMAIL, subject, text, html })
    .catch((error) => console.error("Order email send failed:", error?.message || error));
}

async function fetchOrderItems(orderId, trx = db) {
  return trx("order_items as oi")
    .leftJoin("products as p", "oi.product_id", "p.id")
    .leftJoin("weight_variants as w", "oi.variant_id", "w.id")
    .where("oi.order_id", orderId)
    .select(
      "oi.id",
      "oi.order_id",
      "oi.product_id",
      "oi.variant_id",
      "oi.product_name",
      "oi.quantity",
      "oi.unit_price",
      "oi.subtotal",
      "p.slug as product_slug",
      "w.label as variant_label"
    )
    .orderBy("oi.id", "asc");
}

async function fetchOrderById(orderId, trx = db) {
  const order = await trx("orders as o")
    .join("users as u", "o.user_id", "u.id")
    .leftJoin("payments as p", "o.id", "p.order_id")
    .where("o.id", orderId)
    .select(
      "o.*",
      "u.name as user_name",
      "u.email as user_email",
      "p.id as payment_id",
      "p.gateway as payment_gateway",
      "p.transaction_id as payment_transaction_id",
      "p.amount as payment_amount",
      "p.status as payment_status",
      "p.paid_at as payment_paid_at"
    )
    .first();

  if (!order) {
    throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
  }

  const items = await fetchOrderItems(order.id, trx);
  return {
    ...order,
    items
  };
}

async function listOwnOrders(userId, { page, limit }) {
  const pageNum = Number(page || 1);
  const limitNum = Number(limit || 10);
  const offset = (pageNum - 1) * limitNum;

  const totalRow = await db("orders").where({ user_id: userId }).count({ count: "*" }).first();
  const total = Number(totalRow?.count || 0);

  const rows = await db("orders")
    .where({ user_id: userId })
    .orderBy("created_at", "desc")
    .limit(limitNum)
    .offset(offset);

  return {
    orders: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / limitNum)
    }
  };
}

async function getOwnOrder(userId, orderId) {
  const order = await fetchOrderById(orderId);
  if (order.user_id !== userId) {
    throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
  }
  return order;
}

async function validateCoupon(couponCode, subtotal, trx) {
  if (!couponCode) {
    return { discount: 0, coupon: null };
  }

  const coupon = await trx("coupons").where({ code: couponCode }).first();
  if (!coupon) {
    throw new ApiError(400, "Invalid coupon code", "INVALID_COUPON");
  }
  if (!coupon.is_active) {
    throw new ApiError(400, "Coupon is inactive", "INVALID_COUPON");
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    throw new ApiError(400, "Coupon has expired", "INVALID_COUPON");
  }
  if (coupon.max_uses !== null && Number(coupon.used_count) >= Number(coupon.max_uses)) {
    throw new ApiError(400, "Coupon usage limit reached", "INVALID_COUPON");
  }
  if (toNumber(subtotal) < toNumber(coupon.min_order_amount)) {
    throw new ApiError(400, "Order does not meet coupon minimum amount", "INVALID_COUPON");
  }

  let discount = 0;
  if (coupon.type === "percentage") {
    discount = (toNumber(subtotal) * toNumber(coupon.value)) / 100;
  } else {
    discount = toNumber(coupon.value);
  }
  if (discount > subtotal) discount = subtotal;

  return { discount, coupon };
}

async function createOrderFromCart(userId, payload) {
  const result = await db.transaction(async (trx) => {
    let cartItems = await trx("cart_items as ci")
      .join("products as p", "ci.product_id", "p.id")
      .join("weight_variants as w", "ci.variant_id", "w.id")
      .where("ci.user_id", userId)
      .where("p.is_active", true)
      .select(
        "ci.id",
        "ci.product_id",
        "ci.variant_id",
        "ci.quantity",
        "p.name as product_name",
        "w.label as variant_label",
        "w.price as variant_price",
        "w.stock as variant_stock"
      );

    // FALLBACK: If DB cart is empty, check if items were provided in payload
    if (!cartItems.length && payload.items && payload.items.length) {
      for (const item of payload.items) {
        // Resolve variant_id from weight object if needed
        const variantId = item.variant_id || (typeof item.weight === 'object' ? item.weight.id : null);
        if (!variantId) throw new ApiError(400, "Missing variant_id for item", "INVALID_PAYLOAD");

        const details = await trx("weight_variants as w")
          .join("products as p", "w.product_id", "p.id")
          .where("w.id", variantId)
          .select("w.*", "p.name as product_name", "p.is_active")
          .first();

        if (!details || !details.is_active) {
          throw new ApiError(404, `Product/Variant not found: ${item.product_id}`, "NOT_FOUND");
        }

        cartItems.push({
          product_id: details.product_id,
          variant_id: details.id,
          quantity: item.quantity,
          product_name: details.product_name,
          variant_label: details.label,
          variant_price: details.price,
          variant_stock: details.stock
        });
      }
    }

    if (!cartItems.length) {
      throw new ApiError(400, "Cart is empty", "EMPTY_CART");
    }

    for (const item of cartItems) {
      if (toNumber(item.variant_stock) < toNumber(item.quantity)) {
        throw new ApiError(
          422,
          `Insufficient stock for ${item.product_name} (${item.variant_label})`,
          "INSUFFICIENT_STOCK",
          {
            product_id: item.product_id,
            variant_id: item.variant_id,
            available_stock: toNumber(item.variant_stock),
            requested_quantity: toNumber(item.quantity)
          }
        );
      }
    }

    const subtotal = cartItems.reduce(
      (sum, item) => sum + toNumber(item.quantity) * toNumber(item.variant_price),
      0
    );

    const { discount, coupon } = await validateCoupon(payload.coupon_code, subtotal, trx);
    const shippingFee = subtotal >= 2000 ? 0 : 150;
    const total = subtotal + shippingFee - discount;

    const [order] = await trx("orders")
      .insert({
        user_id: userId,
        status: "pending",
        subtotal,
        shipping_fee: shippingFee,
        discount,
        total,
        shipping_address: payload.shipping_address,
        coupon_code: coupon?.code || null,
        notes: payload.notes || null
      })
      .returning("*");

    const orderItemRows = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.variant_price,
      subtotal: toNumber(item.quantity) * toNumber(item.variant_price)
    }));
    await trx("order_items").insert(orderItemRows);

    for (const item of cartItems) {
      await trx("weight_variants")
        .where({ id: item.variant_id })
        .decrement("stock", item.quantity);
    }

    if (coupon) {
      await trx("coupons").where({ id: coupon.id }).increment("used_count", 1);
    }

    await trx("cart_items").where({ user_id: userId }).del();

    const [payment] = await trx("payments")
      .insert({
        order_id: order.id,
        gateway: payload.payment_method,
        amount: total,
        status: "pending"
      })
      .returning("*");

    return {
      orderId: order.id,
      paymentUrl: buildPaymentUrl(order.id, payload.payment_method),
      payment,
      subtotal,
      total
    };
  });

  const order = await fetchOrderById(result.orderId);

  sendOrderEmailAsync({
    to: order.user_email,
    subject: `Order confirmation - ${order.id}`,
    text: `Your NaturaDry order has been placed. Status: ${order.status}`,
    html: `<p>Your NaturaDry order has been placed.</p><p>Order ID: <strong>${order.id}</strong></p><p>Status: ${order.status}</p>`
  });

  return {
    order,
    payment_url: result.paymentUrl
  };
}

async function cancelOwnOrder(userId, orderId) {
  return db.transaction(async (trx) => {
    const order = await trx("orders").where({ id: orderId, user_id: userId }).first();
    if (!order) {
      throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
    }
    if (order.status !== "pending") {
      throw new ApiError(400, "Only pending orders can be cancelled", "INVALID_ORDER_STATE");
    }

    await trx("orders")
      .where({ id: orderId })
      .update({ status: "cancelled", updated_at: trx.fn.now() });

    const items = await trx("order_items").where({ order_id: orderId }).select("variant_id", "quantity");
    for (const item of items) {
      await trx("weight_variants")
        .where({ id: item.variant_id })
        .increment("stock", item.quantity);
    }

    const updated = await fetchOrderById(orderId, trx);
    sendOrderEmailAsync({
      to: updated.user_email,
      subject: `Order cancelled - ${updated.id}`,
      text: "Your order has been cancelled.",
      html: `<p>Your order <strong>${updated.id}</strong> has been cancelled.</p>`
    });

    return updated;
  });
}

async function listAdminOrders(filters) {
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const offset = (page - 1) * limit;

  const query = db("orders as o").join("users as u", "o.user_id", "u.id");
  if (filters.status) query.where("o.status", filters.status);
  if (filters.user_id) query.where("o.user_id", filters.user_id);
  if (filters.date_from) query.where("o.created_at", ">=", new Date(filters.date_from));
  if (filters.date_to) query.where("o.created_at", "<=", new Date(filters.date_to));

  const totalRow = await query.clone().count({ count: "o.id" }).first();
  const total = Number(totalRow?.count || 0);

  const orders = await query
    .clone()
    .select("o.*", "u.name as user_name", "u.email as user_email")
    .orderBy("o.created_at", "desc")
    .limit(limit)
    .offset(offset);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / limit)
    }
  };
}

async function updateOrderStatusByAdmin(orderId, payload) {
  return db.transaction(async (trx) => {
    const order = await trx("orders").where({ id: orderId }).first();
    if (!order) {
      throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
    }

    const allowed = STATUS_TRANSITIONS[order.status] || [];
    if (!allowed.includes(payload.status)) {
      throw new ApiError(
        400,
        `Invalid status transition from ${order.status} to ${payload.status}`,
        "INVALID_ORDER_STATE"
      );
    }

    const updates = {
      status: payload.status,
      updated_at: trx.fn.now()
    };
    if (payload.status === "shipped") {
      if (!payload.tracking_number || !payload.courier) {
        throw new ApiError(
          400,
          "tracking_number and courier are required when shipping an order",
          "VALIDATION_ERROR"
        );
      }
      updates.tracking_number = payload.tracking_number || null;
      updates.courier = payload.courier || null;
    }

    await trx("orders").where({ id: orderId }).update(updates);
    const updated = await fetchOrderById(orderId, trx);

    sendOrderEmailAsync({
      to: updated.user_email,
      subject: `Order status updated - ${updated.id}`,
      text: `Your order status is now: ${updated.status}`,
      html: `<p>Your order <strong>${updated.id}</strong> status is now <strong>${updated.status}</strong>.</p>`
    });

    return updated;
  });
}

module.exports = {
  listOwnOrders,
  getOwnOrder,
  createOrderFromCart,
  cancelOwnOrder,
  listAdminOrders,
  updateOrderStatusByAdmin
};
