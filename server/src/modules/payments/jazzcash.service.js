const crypto = require("crypto");
const JazzCash = require("@zfhassaan/jazzcash");
const { JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, JAZZCASH_INTEGRITY_SALT, NODE_ENV, FRONTEND_URL } = require("../../config/env");

let jazzcashClient;

const getJazzcashClient = () => {
  if (!jazzcashClient) {
    jazzcashClient = new JazzCash({
      merchantId: JAZZCASH_MERCHANT_ID || "",
      password: JAZZCASH_PASSWORD || "",
      integritySalt: JAZZCASH_INTEGRITY_SALT || "",
      environment: NODE_ENV === "production" ? "production" : "sandbox"
    });
  }
  return jazzcashClient;
};

async function initiateJazzcashPayment(order) {
  const amountStr = Math.round(Number(order.total) * 100).toString(); // in paisa

  const transactionData = {
    amount: amountStr,
    billReference: "order_" + order.id,
    description: "Payment for order " + order.id,
    returnUrl: `${FRONTEND_URL}/payment/callback/jazzcash`
  };

  const response = await getJazzcashClient().initiateTransaction(transactionData);

  return response;
}

function verifyHash(data) {
  const secureHash = data.pp_SecureHash;
  if (!secureHash) return false;

  // Since the package's generateSecureHash method does not match standard Hosted Checkout webhook hash,
  // we still use the standard HMAC validation for the webhook, or we can try using the package's generator.
  // The package hashes like this: crypto.createHmac('sha256', this.integritySalt).update(hashString).digest('hex')
  const sortedKeys = Object.keys(data).filter(k => k !== "pp_SecureHash" && data[k] !== "" && data[k] !== null).sort();
  const hashString = sortedKeys.map(k => data[k]).join("&");

  const computedHash = crypto.createHmac("sha256", JAZZCASH_INTEGRITY_SALT || "")
    .update(hashString)
    .digest("hex")
    .toUpperCase();

  // We should also check the standard JazzCash way just in case:
  const standardHashString = (JAZZCASH_INTEGRITY_SALT || "") + "&" + sortedKeys.map(k => data[k]).join("&");
  const standardComputedHash = crypto.createHmac("sha256", JAZZCASH_INTEGRITY_SALT || "")
    .update(standardHashString)
    .digest("hex")
    .toUpperCase();

  return computedHash === secureHash || standardComputedHash === secureHash;
}

module.exports = {
  initiateJazzcashPayment,
  verifyHash
};
