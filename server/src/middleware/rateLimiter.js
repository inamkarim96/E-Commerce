const rateLimit = require("express-rate-limit");
const { NODE_ENV } = require("../config/env");

// In development / test, skip all rate limiting so local dev isn't interrupted.
const isDev = NODE_ENV === "development" || NODE_ENV === "test";

/**
 * Global rate limiter — applied to all /api routes.
 * Allows 200 requests per 15 minutes per IP.
 */
const globalLimiter = isDev
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200,
      standardHeaders: true,     // Return RateLimit-* headers
      legacyHeaders: false,
      message: {
        success: false,
        error: { code: "RATE_LIMITED", message: "Too many requests, please try again later." }
      }
    });

/**
 * Auth-specific rate limiter — applied to /auth routes.
 * Stricter: 10 requests per 15 minutes per IP.
 * Protects against brute-force login attacks.
 */
const authLimiter = isDev
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: { code: "AUTH_RATE_LIMITED", message: "Too many auth attempts, please try again in 15 minutes." }
      }
    });

module.exports = { globalLimiter, authLimiter };

