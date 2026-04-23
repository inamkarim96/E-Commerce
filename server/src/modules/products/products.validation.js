const Joi = require("joi");

const variantSchema = Joi.object({
  label: Joi.string().trim().max(50).required(),
  weight_grams: Joi.number().integer().positive().required(),
  price: Joi.number().precision(2).positive().required(),
  stock: Joi.number().integer().min(0).default(0)
});

const createProductSchema = Joi.object({
  category_id: Joi.string().uuid().required(),
  name: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().trim().allow("", null).optional(),
  base_price: Joi.number().precision(2).positive().required(),
  stock: Joi.number().integer().min(0).default(0),
  images: Joi.array().items(Joi.string().uri()).default([]),
  is_featured: Joi.boolean().default(false),
  is_active: Joi.boolean().default(true),
  weight_variants: Joi.array().items(variantSchema).min(1).required()
});

const updateProductSchema = Joi.object({
  category_id: Joi.string().uuid().optional(),
  name: Joi.string().trim().min(2).max(200).optional(),
  description: Joi.string().trim().allow("", null).optional(),
  base_price: Joi.number().precision(2).positive().optional(),
  stock: Joi.number().integer().min(0).optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  is_featured: Joi.boolean().optional(),
  is_active: Joi.boolean().optional(),
  weight_variants: Joi.array().items(variantSchema).min(1).optional()
}).min(1);

const updateStockSchema = Joi.object({
  stock: Joi.number().integer().min(0).required()
});

const listProductsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  category: Joi.string().trim().optional(),
  min_price: Joi.number().precision(2).min(0).optional(),
  max_price: Joi.number().precision(2).min(0).optional(),
  sort: Joi.string()
    .valid("price_asc", "price_desc", "newest", "popular")
    .default("newest")
});

const searchProductsSchema = Joi.object({
  q: Joi.string().trim().min(1).required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

function validate(schema, payload) {
  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true
  });
  return { error, value };
}

module.exports = {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
  listProductsSchema,
  searchProductsSchema,
  validate
};
