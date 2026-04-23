const express = require("express");
const controller = require("./analytics.controller");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");

const router = express.Router();

router.use(auth, role("admin"));

router.get("/overview", controller.getOverview);
router.get("/revenue", controller.getRevenue);
router.get("/top-products", controller.getTopProducts);
router.get("/inventory", controller.getInventory);

module.exports = router;
