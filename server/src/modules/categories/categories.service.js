const { db } = require("../../config/db");
const ApiError = require("../../utils/apiError");
const slugify = require("../../utils/slugify");

const PREDEFINED_CATEGORIES = [
  {
    name: 'Dried Fruits',
    slug: 'fruits',
    image: 'https://images.unsplash.com/photo-1596003906949-67221c37965c?auto=format&fit=crop&q=80&w=600',
  },
  {
    name: 'Premium Nuts',
    slug: 'nuts',
    image: 'https://images.unsplash.com/photo-1536620942726-595e0ea90171?auto=format&fit=crop&q=80&w=600',
  },
  {
    name: 'Natural Herbs',
    slug: 'herbs',
    image: 'https://images.unsplash.com/photo-1591854265825-c224c6cb6dcb?auto=format&fit=crop&q=80&w=600',
  },
  {
    name: 'Healthy Snacks',
    slug: 'snacks',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600',
  }
];

async function buildUniqueCategorySlug(name, excludeId = null) {
  const base = slugify(name);
  let slug = base;

  for (let i = 0; i < 10; i += 1) {
    const query = db("categories").where({ slug });
    if (excludeId) {
      query.whereNot({ id: excludeId });
    }
    const existing = await query.first();
    
    if (!existing) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }

  throw new ApiError(500, "Unable to generate unique slug", "SLUG_GENERATION_FAILED");
}

async function listCategories() {
  const categories = await db("categories as c")
    .select("c.*")
    .leftJoin("products as p", function() {
      this.on("c.id", "p.category_id").andOn("p.is_active", "=", db.raw("?", [true]));
    })
    .count("p.id as product_count")
    .groupBy("c.id")
    .orderBy("c.created_at", "desc");

  return categories.map((cat) => ({
    ...cat,
    product_count: Number(cat.product_count || 0)
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

  const updates = { updated_at: db.fn.now() };

  if (payload.name && payload.name !== existing.name) {
    updates.name = payload.name;
    updates.slug = await buildUniqueCategorySlug(payload.name, id);
  }
  if (payload.image !== undefined) {
    updates.image = payload.image || null;
  }

  const [updated] = await db("categories")
    .where({ id })
    .update(updates)
    .returning("*");

  return updated;
}

async function deleteCategory(id) {
  const category = await db("categories as c")
    .where("c.id", id)
    .leftJoin("products as p", "c.id", "p.category_id")
    .select("c.id")
    .count("p.id as product_count")
    .groupBy("c.id")
    .first();

  if (!category) {
    throw new ApiError(404, "Category not found", "CATEGORY_NOT_FOUND");
  }

  if (Number(category.product_count) > 0) {
    throw new ApiError(
      400,
      "Cannot delete category with linked products",
      "CATEGORY_HAS_PRODUCTS"
    );
  }

  await db("categories").where({ id }).del();
}

async function initializeDefaults() {
  const existingCount = await db("categories").count({ count: "*" }).first();
  if (Number(existingCount.count) > 0) {
    return { message: "Categories already exist", count: 0 };
  }

  await db("categories").insert(PREDEFINED_CATEGORIES);
  return { message: "Default categories initialized", count: PREDEFINED_CATEGORIES.length };
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  initializeDefaults,
  PREDEFINED_CATEGORIES
};
