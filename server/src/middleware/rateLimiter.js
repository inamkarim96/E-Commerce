const rateLimit = require("express-rate-limit");
const { NODE_ENV } = require("../config/env");

const globalLimiter = (req, res, next) => next();
const authLimiter = (req, res, next) => next();

module.exports = {
  globalLimiter,
  authLimiter,
};
