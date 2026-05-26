const authService = require("./auth.service");
const ApiError = require("../../utils/apiError");
const { sendSuccess } = require("../../utils/apiResponse");
const { loginSchema, validate } = require("./auth.validation");

async function login(req, res) {
  const { error, value } = validate(loginSchema, req.body);
  if (error) {
    throw new ApiError(400, error.message, "VALIDATION_ERROR");
  }

  const result = await authService.login(value);
  
  return sendSuccess(res, {
    customToken: result.customToken
  });
}

async function finalizeLogin(req, res) {
  const { idToken } = req.body;
  if (!idToken) {
    throw new ApiError(400, "idToken is required", "VALIDATION_ERROR");
  }

  const result = await authService.finalizeLoginAfterVerification(idToken);

  return sendSuccess(res, {
    user: result.user
  });
}

async function firebaseLogin(req, res) {
  const { idToken, profileData } = req.body;
  if (!idToken) {
    throw new ApiError(400, "ID Token is required", "VALIDATION_ERROR");
  }

  const result = await authService.firebaseLogin(idToken, profileData);

  return sendSuccess(res, {
    user: result.user,
    status: result.status,
    email: result.email,
    customToken: result.customToken
  });
}

module.exports = {
  login,
  finalizeLogin,
  firebaseLogin
};
