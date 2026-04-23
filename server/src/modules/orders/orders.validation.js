const Joi = require("joi");

const createOrderSchema = Joi.object({
  shipping_address: Joi.object().required(),
  payment_method: Joi.string()
    .valid("jazzcash", "easypaisa", "stripe", "cod")
    .required(),
  coupon_code: Joi.string().trim().max(50).allow("", null).optional(),
  notes: Joi.string().trim().allow("", null).optional()
});

const listOwnOrdersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const adminListOrdersSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "processing", "shipped", "delivered", "cancelled")
    .optional(),
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  user_id: Joi.string().uuid().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const adminUpdateStatusSchema = Joi.object({
  status: Joi.string()
    .valid("processing", "shipped", "delivered", "cancelled")
    .required(),
  tracking_number: Joi.string().trim().max(100).allow("", null).optional(),
  courier: Joi.string().trim().max(100).allow("", null).optional()
});

function validate(schema, payload) {
  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true
  });
  return { error, value };
}

module.exports = {
  createOrderSchema,
  listOwnOrdersSchema,
  adminListOrdersSchema,
  adminUpdateStatusSchema,
  validate
};
