const { db } = require("../../config/db");
const ApiError = require("../../utils/apiError");
const slugify = require("../../utils/slugify");

async function buildUniqueCategorySlug(name, excludeId = null) {
  const base = slugify(name);
  let slug = base;

  for (let i = 0; i < 10; i += 1) {
    const query = db("categories").where({ slug });
    if (excludeId) query.whereNot({ id: excludeId });
    const existing = await query.first();
    if (!existing) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }

  throw new ApiError(500, "Unable to generate unique slug", "SLUG_GENERATION_FAILED");
}

async function listCategories() {
  const rows = await db("categories as c")
    .leftJoin("products as p", function joinProducts() {
      this.on("c.id", "=", "p.category_id").andOn("p.is_active", "=", db.raw("?", [true]));
    })
    .groupBy("c.id")
    .select(
      "c.id",
      "c.name",
      "c.slug",
      "c.image",
      "c.created_at",
      "c.updated_at"
    )
    .count({ product_count: "p.id" })
    .orderBy("c.created_at", "desc");

  return rows.map((row) => ({
    ...row,
    product_count: Number(row.product_count || 0)
  }));
}

async function getCategoryById(id) {
  const category = await db("categories").where({ id }).first();
  if (!category) {
    throw new ApiError(404, "Category not found", "CATEGORY_NOT_FOUND");
  }
  return category;
}

async function createCategory(payload) {
  const slug = await buildUniqueCategorySlug(payload.name);
  const [category] = await db("categories")
    .insert({
      name: payload.name,
      slug,
      image: payload.image || null
    })
    .returning("*");

  return category;
}

async function updateCategory(id, payload) {
  const existing = await db("categories").where({ id }).first();
  if (!existing) {
    throw new ApiError(404, "Category not found", "CATEGORY_NOT_FOUND");
  }

  const updates = {
    updated_at: db.fn.now()
  };

  if (payload.name && payload.name !== existing.name) {
    updates.name = payload.name;
    updates.slug = await buildUniqueCategorySlug(payload.name, id);
  }
  if (Object.prototype.hasOwnProperty.call(payload, "image")) {
    updates.image = payload.image || null;
  }

  const [updated] = await db("categories").where({ id }).update(updates).returning("*");
  return updated;
}

async function deleteCategory(id) {
  const category = await db("categories").where({ id }).first();
  if (!category) {
    throw new ApiError(404, "Category not found", "CATEGORY_NOT_FOUND");
  }

  const productCount = await db("products").where({ category_id: id }).count({ count: "*" }).first();
  if (Number(productCount.count || 0) > 0) {
    throw new ApiError(
      400,
      "Cannot delete category with linked products",
      "CATEGORY_HAS_PRODUCTS"
    );
  }

  await db("categories").where({ id }).del();
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
