const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const googleCodeController = require("./googleCode.controller");
const authController = require("./auth.controller");

const router = express.Router();

router.post("/login", asyncHandler(authController.login));
router.post("/google-code", asyncHandler(googleCodeController.exchangeCode));
router.post("/finalize-login", asyncHandler(authController.finalizeLogin));
router.post("/firebase-login", asyncHandler(authController.firebaseLogin));

module.exports = router;
