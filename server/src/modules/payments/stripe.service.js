const stripe = require("stripe");
const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } = require("../../config/env");

let stripeClient;

const getStripeClient = () => {
  if (!stripeClient) {
    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured in environment variables.");
    }
    stripeClient = stripe(STRIPE_SECRET_KEY);
  }
  return stripeClient;
};

async function createPaymentIntent(order) {
  const amount = Math.round(Number(order.total) * 100); // PKR uses paisa (100)
  
  const paymentIntent = await getStripeClient().paymentIntents.create({
    amount,
    currency: "pkr",
    metadata: {
      order_id: order.id
    }
  });

  return {
    client_secret: paymentIntent.client_secret,
    payment_url: null // PaymentIntents do not provide a direct payment_url, clients use client_secret directly with Elements
  };
}

function verifyWebhook(body, signature) {
  return getStripeClient().webhooks.constructEvent(
    body,
    signature,
    STRIPE_WEBHOOK_SECRET
  );
}

module.exports = {
  createPaymentIntent,
  verifyWebhook
};
