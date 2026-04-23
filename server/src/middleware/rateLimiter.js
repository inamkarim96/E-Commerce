const rateLimit = require("express-rate-limit");
const { NODE_ENV } = require("../config/env");

const globalLimiter = NODE_ENV === "test" ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT",
      message: "Too many requests from this IP, please try again after 15 minutes",
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const authLimiter = NODE_ENV === "test" ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window for auth routes
  message: {
    success: false,
    error: {
      code: "AUTH_RATE_LIMIT",
      message: "Too many login attempts, please try again after 15 minutes",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  globalLimiter,
  authLimiter,
};
