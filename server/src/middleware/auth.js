const jwt = require("jsonwebtoken");
const { JWT_ACCESS_SECRET } = require("../config/env");
const ApiError = require("../utils/apiError");

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "Unauthorized", "UNAUTHORIZED"));
  }

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return next(new ApiError(401, "Invalid or expired token", "INVALID_TOKEN"));
  }
}

module.exports = auth;
