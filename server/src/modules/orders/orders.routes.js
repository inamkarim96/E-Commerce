const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const controller = require("./orders.controller");

const router = express.Router();

router.get("/orders", auth, asyncHandler(controller.listOwnOrders));
router.get("/orders/:id", auth, asyncHandler(controller.getOwnOrder));
router.post("/orders", auth, asyncHandler(controller.createOrder));
router.post("/orders/:id/cancel", auth, asyncHandler(controller.cancelOwnOrder));

router.get("/admin/orders", auth, role("admin"), asyncHandler(controller.listAdminOrders));
router.patch(
  "/admin/orders/:id",
  auth,
  role("admin"),
  asyncHandler(controller.updateOrderStatusByAdmin)
);

module.exports = router;
