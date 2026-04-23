const express = require("express");
const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const authRoutes = require("../modules/auth/auth.routes");
const categoriesRoutes = require("../modules/categories/categories.routes");
const productsRoutes = require("../modules/products/products.routes");
const cartRoutes = require("../modules/cart/cart.routes");
const ordersRoutes = require("../modules/orders/orders.routes");
const paymentsRoutes = require("../modules/payments/payments.routes");
const usersRoutes = require("../modules/users/users.routes");
const reviewsRoutes = require("../modules/reviews/reviews.routes");
const couponsRoutes = require("../modules/coupons/coupons.routes");
const analyticsRoutes = require("../modules/admin/analytics.routes");

const router = express.Router();

router.get(
  "/health",
  asyncHandler(async (req, res) => {
    sendSuccess(res, { message: "NaturaDry backend is running" });
  })
);

router.use("/auth", authRoutes);
router.use("/categories", categoriesRoutes);
router.use("/products", productsRoutes);
router.use("/cart", cartRoutes);
router.use("/", ordersRoutes);
router.use("/", paymentsRoutes);
router.use("/", usersRoutes);
router.use("/reviews", reviewsRoutes);
router.use("/coupons", couponsRoutes);
router.use("/admin/analytics", analyticsRoutes);

module.exports = router;
