const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { globalLimiter, authLimiter } = require("./middleware/rateLimiter");

const { FRONTEND_URL } = require("./config/env");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const apiV1Router = require("./routes");

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        connectSrc: ["'self'", "https://api.stripe.com"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true
  })
);

app.use(cookieParser());
app.use("/auth", authLimiter);
app.use("/", globalLimiter);

app.use("/payments/webhook/stripe", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(requestLogger);

app.use("/", apiV1Router);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found"
    }
  });
});

app.use(errorHandler);

module.exports = app;
