const dotenv = require("dotenv");
const Joi = require("joi");

dotenv.config();

const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),
  PORT: Joi.number().integer().min(1).max(65535).default(5000),
  DATABASE_URL: Joi.string().uri().required(),
  REDIS_URL: Joi.string().uri({ scheme: ["redis", "rediss"] }).allow("").optional(),
  FRONTEND_URL: Joi.string().uri().required(),
  BACKEND_URL: Joi.string().uri().default("http://localhost:8080"),
  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES: Joi.string().default("15m"),
  JWT_REFRESH_EXPIRES: Joi.string().default("7d"),
  CLOUDINARY_CLOUD_NAME: Joi.string().allow("").optional(),
  CLOUDINARY_API_KEY: Joi.string().allow("").optional(),
  CLOUDINARY_API_SECRET: Joi.string().allow("").optional(),
  SENDGRID_API_KEY: Joi.string().allow("").optional(),
  SENDGRID_FROM_EMAIL: Joi.string().email().allow("").optional(),
  JAZZCASH_MERCHANT_ID: Joi.string().allow("").optional(),
  JAZZCASH_PASSWORD: Joi.string().allow("").optional(),
  JAZZCASH_INTEGRITY_SALT: Joi.string().allow("").optional(),
  STRIPE_SECRET_KEY: Joi.string().allow("").optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow("").optional()
})
  .unknown()
  .required();

const { error, value } = schema.validate(process.env, {
  abortEarly: false,
  convert: true
});

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

const {
  NODE_ENV,
  PORT,
  DATABASE_URL,
  REDIS_URL,
  FRONTEND_URL,
  BACKEND_URL,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES,
  JWT_REFRESH_EXPIRES,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL,
  JAZZCASH_MERCHANT_ID,
  JAZZCASH_PASSWORD,
  JAZZCASH_INTEGRITY_SALT,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET
} = value;

module.exports = {
  NODE_ENV,
  PORT,
  DATABASE_URL,
  REDIS_URL,
  FRONTEND_URL,
  BACKEND_URL,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES,
  JWT_REFRESH_EXPIRES,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL,
  JAZZCASH_MERCHANT_ID,
  JAZZCASH_PASSWORD,
  JAZZCASH_INTEGRITY_SALT,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET
};
