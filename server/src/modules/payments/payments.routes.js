const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const controller = require("./payments.controller");

const router = express.Router();

router.post("/payments/initiate", auth, asyncHandler(controller.initiatePayment));
router.post("/payments/webhook/jazzcash", asyncHandler(controller.jazzcashWebhook));
router.post("/payments/webhook/stripe", asyncHandler(controller.stripeWebhook));
// JazzCash redirects the browser back here after payment (supports both GET & POST)
router.get("/payments/callback/jazzcash", asyncHandler(controller.jazzcashCallback));
router.post("/payments/callback/jazzcash", asyncHandler(controller.jazzcashCallback));
router.get("/payments/order/:orderId", auth, asyncHandler(controller.getPaymentStatus));

router.post("/admin/payments/refund", auth, role("admin"), asyncHandler(controller.adminRefund));

module.exports = router;
