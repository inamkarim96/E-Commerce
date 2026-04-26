const express = require("express");
const asyncHandler = require("../../utils/asyncHandler");
const authController = require("./auth.controller");

const router = express.Router();

router.post("/register", asyncHandler(authController.register));
router.post("/login", asyncHandler(authController.login));
router.post("/refresh", asyncHandler(authController.refresh));
router.post("/logout", asyncHandler(authController.logout));
router.post("/forgot-password", asyncHandler(authController.forgotPassword));
router.post("/reset-password", asyncHandler(authController.resetPassword));
router.post("/verify-email", asyncHandler(authController.verifyEmail));
router.post("/finalize-login", asyncHandler(authController.finalizeLogin));
router.post("/firebase-login", asyncHandler(authController.firebaseLogin));

module.exports = router;
