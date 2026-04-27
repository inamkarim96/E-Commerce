const authService = require("./auth.service");
const jwt = require("jsonwebtoken");
const ApiError = require("../../utils/apiError");
const { sendSuccess } = require("../../utils/apiResponse");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  validate
} = require("./auth.validation");

function setRefreshCookie(res, refreshToken) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

async function register(req, res) {
  const { error, value } = validate(registerSchema, req.body);
  if (error) {
    throw new ApiError(400, error.message, "VALIDATION_ERROR");
  }

  const user = await authService.register(value);
  return sendSuccess(res, { user }, 201);
}

async function login(req, res) {
  const { error, value } = validate(loginSchema, req.body);
  if (error) {
    throw new ApiError(400, error.message, "VALIDATION_ERROR");
  }

  const result = await authService.login(value);
  if (result.refreshToken) {
    setRefreshCookie(res, result.refreshToken);
  }

  return sendSuccess(res, {
    accessToken: result.accessToken,
    user: result.user,
    status: result.status,
    email: result.email,
    customToken: result.customToken
  });
}

async function refresh(req, res) {
  const refreshToken =
    req.cookies?.refreshToken ||
    authService.parseCookieValue(req.headers.cookie, "refreshToken");

  const result = await authService.refresh(refreshToken);
  setRefreshCookie(res, result.refreshToken);

  return sendSuccess(res, {
    accessToken: result.accessToken,
    user: result.user
  });
}

async function logout(req, res) {
  const refreshToken =
    req.cookies?.refreshToken ||
    authService.parseCookieValue(req.headers.cookie, "refreshToken");

  let userId = null;
  if (refreshToken) {
    try {
      const decoded = jwt.decode(refreshToken);
      userId = decoded?.sub || null;
    } catch (error) {
      userId = null;
    }
  }

  await authService.logout(userId);
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict"
  });

  return sendSuccess(res, { message: "Logged out successfully" });
}

async function forgotPassword(req, res) {
  const { error, value } = validate(forgotPasswordSchema, req.body);
  if (error) {
    throw new ApiError(400, error.message, "VALIDATION_ERROR");
  }

  await authService.forgotPassword(value.email);
  return sendSuccess(res, {
    message: "If the account exists, a password reset OTP has been sent"
  });
}

async function resetPassword(req, res) {
  const { error, value } = validate(resetPasswordSchema, req.body);
  if (error) {
    throw new ApiError(400, error.message, "VALIDATION_ERROR");
  }

  await authService.resetPassword(value.email, value.otp, value.newPassword);
  return sendSuccess(res, { message: "Password reset successful" });
}

async function verifyEmail(req, res) {
  const { error, value } = validate(verifyEmailSchema, req.query);
  if (error) {
    throw new ApiError(400, error.message, "VALIDATION_ERROR");
  }

  await authService.verifyEmail(value.token);
  return sendSuccess(res, { message: "Email verified successfully" });
}

async function finalizeLogin(req, res) {
  const { idToken } = req.body;
  if (!idToken) {
    throw new ApiError(400, "idToken is required", "VALIDATION_ERROR");
  }

  const result = await authService.finalizeLoginAfterVerification(idToken);
  setRefreshCookie(res, result.refreshToken);

  return sendSuccess(res, {
    accessToken: result.accessToken,
    user: result.user
  });
}

async function firebaseLogin(req, res) {
  const { idToken, profileData } = req.body;
  if (!idToken) {
    throw new ApiError(400, "ID Token is required", "VALIDATION_ERROR");
  }

  const result = await authService.firebaseLogin(idToken, profileData);
  setRefreshCookie(res, result.refreshToken);

  return sendSuccess(res, {
    accessToken: result.accessToken,
    user: result.user,
    status: result.status,
    email: result.email,
    customToken: result.customToken
  });
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  finalizeLogin,
  firebaseLogin
};
