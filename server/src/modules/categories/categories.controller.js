const Joi = require("joi");
const categoriesService = require("./categories.service");
const ApiError = require("../../utils/apiError");
const { sendSuccess } = require("../../utils/apiResponse");

const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  image: Joi.string().trim().uri().allow("", null).optional()
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  image: Joi.string().trim().uri().allow("", null).optional()
}).min(1);

function validate(schema, payload) {
  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true
  });
  if (error) {
    throw new ApiError(400, error.message, "VALIDATION_ERROR");
  }
  return value;
}

async function listCategories(req, res) {
  const categories = await categoriesService.listCategories();
  return sendSuccess(res, { categories });
}

async function getCategoryById(req, res) {
  const category = await categoriesService.getCategoryById(req.params.id);
  return sendSuccess(res, { category });
}

async function createCategory(req, res) {
  const payload = validate(createCategorySchema, req.body);
  const category = await categoriesService.createCategory(payload);
  return sendSuccess(res, { category }, 201);
}

async function updateCategory(req, res) {
  const payload = validate(updateCategorySchema, req.body);
  const category = await categoriesService.updateCategory(req.params.id, payload);
  return sendSuccess(res, { category });
}

async function deleteCategory(req, res) {
  await categoriesService.deleteCategory(req.params.id);
  return sendSuccess(res, { message: "Category deleted successfully" });
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
