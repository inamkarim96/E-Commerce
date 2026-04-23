const { db } = require("../../config/db");
const ApiError = require("../../utils/apiError");
const slugify = require("../../utils/slugify");

async function ensureUniqueSlug(name, excludeId = null) {
  const baseSlug = slugify(name);
  let slug = baseSlug;

  for (let i = 0; i < 15; i += 1) {
    const query = db("products").where({ slug });
    if (excludeId) query.whereNot({ id: excludeId });
    const existing = await query.first();
    if (!existing) return slug;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  throw new ApiError(500, "Unable to generate product slug", "SLUG_GENERATION_FAILED");
}

async function fetchVariantsByProductIds(productIds, trx = db) {
  if (!productIds.length) return {};

  const rows = await trx("weight_variants")
    .whereIn("product_id", productIds)
    .select("id", "product_id", "label", "weight_grams", "price", "stock")
    .orderBy("weight_grams", "asc");

  return rows.reduce((acc, row) => {
    if (!acc[row.product_id]) acc[row.product_id] = [];
    acc[row.product_id].push(row);
    return acc;
  }, {});
}

async function fetchReviewStatsByProductIds(productIds, trx = db) {
  if (!productIds.length) return {};

  const rows = await trx("reviews")
    .whereIn("product_id", productIds)
    .groupBy("product_id")
    .select("product_id")
    .avg({ avg_rating: "rating" })
    .count({ review_count: "*" });

  return rows.reduce((acc, row) => {
    acc[row.product_id] = {
      avg_rating: row.avg_rating ? Number(row.avg_rating) : 0,
      review_count: Number(row.review_count || 0)
    };
    return acc;
  }, {});
}

function mapProduct(row, variantsMap, reviewMap) {
  const review = reviewMap[row.id] || { avg_rating: 0, review_count: 0 };
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    base_price: row.base_price,
    stock: row.stock,
    images: row.images || [],
    is_featured: row.is_featured,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    category: {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
      image: row.category_image
    },
    weight_variants: variantsMap[row.id] || [],
    avg_rating: review.avg_rating,
    review_count: review.review_count
  };
}

function applyListFilters(query, filters) {
  query.where("p.is_active", true);

  if (filters.category) {
    query.andWhere("c.slug", filters.category);
  }
  if (filters.min_price !== undefined) {
    query.andWhere("p.base_price", ">=", filters.min_price);
  }
  if (filters.max_price !== undefined) {
    query.andWhere("p.base_price", "<=", filters.max_price);
  }
}

async function listProducts(filters) {
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const offset = (page - 1) * limit;

  const baseQuery = db("products as p")
    .join("categories as c", "p.category_id", "c.id")
    .select(
      "p.id",
      "p.category_id",
      "p.name",
      "p.slug",
      "p.description",
      "p.base_price",
      "p.stock",
      "p.images",
      "p.is_featured",
      "p.is_active",
      "p.created_at",
      "p.updated_at",
      "c.name as category_name",
      "c.slug as category_slug",
      "c.image as category_image"
    );

  applyListFilters(baseQuery, filters);
  if (filters.featuredOnly) {
    baseQuery.andWhere("p.is_featured", true);
  }

  const totalRow = await db("products as p")
    .join("categories as c", "p.category_id", "c.id")
    .modify((queryBuilder) => {
      applyListFilters(queryBuilder, filters);
      if (filters.featuredOnly) {
        queryBuilder.andWhere("p.is_featured", true);
      }
    })
    .count({ count: "p.id" })
    .first();
  const total = Number(totalRow?.count || 0);

  if (filters.sort === "price_asc") {
    baseQuery.orderBy("p.base_price", "asc");
  } else if (filters.sort === "price_desc") {
    baseQuery.orderBy("p.base_price", "desc");
  } else if (filters.sort === "popular") {
    baseQuery
      .leftJoin("reviews as r", "p.id", "r.product_id")
      .count({ popularity: "r.id" })
      .groupBy(
        "p.id",
        "c.id",
        "c.name",
        "c.slug",
        "c.image"
      )
      .orderBy("popularity", "desc")
      .orderBy("p.created_at", "desc");
  } else {
    baseQuery.orderBy("p.created_at", "desc");
  }

  const rows = await baseQuery.limit(limit).offset(offset);
  const productIds = rows.map((row) => row.id);
  const [variantsMap, reviewMap] = await Promise.all([
    fetchVariantsByProductIds(productIds),
    fetchReviewStatsByProductIds(productIds)
  ]);

  const products = rows.map((row) => mapProduct(row, variantsMap, reviewMap));
  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / limit)
    }
  };
}

async function getFeaturedProducts() {
  return listProducts({ page: 1, limit: 20, sort: "newest", featuredOnly: true }).then(
    (result) => result.products
  );
}

async function searchProducts({ q, page, limit }) {
  const pageNum = Number(page || 1);
  const limitNum = Number(limit || 10);
  const offset = (pageNum - 1) * limitNum;

  const query = db("products as p")
    .join("categories as c", "p.category_id", "c.id")
    .where("p.is_active", true)
    .andWhere((builder) => {
      builder.whereILike("p.name", `%${q}%`).orWhereILike("p.description", `%${q}%`);
    });

  const totalRow = await query.clone().count({ count: "p.id" }).first();
  const total = Number(totalRow?.count || 0);

  const rows = await query
    .clone()
    .select(
      "p.id",
      "p.category_id",
      "p.name",
      "p.slug",
      "p.description",
      "p.base_price",
      "p.stock",
      "p.images",
      "p.is_featured",
      "p.is_active",
      "p.created_at",
      "p.updated_at",
      "c.name as category_name",
      "c.slug as category_slug",
      "c.image as category_image"
    )
    .orderBy("p.created_at", "desc")
    .limit(limitNum)
    .offset(offset);

  const ids = rows.map((row) => row.id);
  const [variantsMap, reviewMap] = await Promise.all([
    fetchVariantsByProductIds(ids),
    fetchReviewStatsByProductIds(ids)
  ]);

  return {
    products: rows.map((row) => mapProduct(row, variantsMap, reviewMap)),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / limitNum)
    }
  };
}

async function getProductById(id, includeInactive = false, trx = db) {
  const query = trx("products as p")
    .join("categories as c", "p.category_id", "c.id")
    .where("p.id", id)
    .select(
      "p.id",
      "p.category_id",
      "p.name",
      "p.slug",
      "p.description",
      "p.base_price",
      "p.stock",
      "p.images",
      "p.is_featured",
      "p.is_active",
      "p.created_at",
      "p.updated_at",
      "c.name as category_name",
      "c.slug as category_slug",
      "c.image as category_image"
    )
    .first();

  if (!includeInactive) {
    query.andWhere("p.is_active", true);
  }

  const row = await query;
  if (!row) {
    throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
  }

  const [variantsMap, reviewMap] = await Promise.all([
    fetchVariantsByProductIds([row.id]),
    fetchReviewStatsByProductIds([row.id])
  ]);

  return mapProduct(row, variantsMap, reviewMap);
}

async function getProductBySlug(slug) {
  const row = await db("products").where({ slug, is_active: true }).first();
  if (!row) {
    throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
  }
  return getProductById(row.id);
}

async function createProduct(payload) {
  return db.transaction(async (trx) => {
    const category = await trx("categories").where({ id: payload.category_id }).first();
    if (!category) {
      throw new ApiError(400, "Invalid category", "INVALID_CATEGORY");
    }

    const slug = await ensureUniqueSlug(payload.name);
    const [product] = await trx("products")
      .insert({
        category_id: payload.category_id,
        name: payload.name,
        slug,
        description: payload.description || null,
        base_price: payload.base_price,
        stock: payload.stock ?? 0,
        images: payload.images || [],
        is_featured: payload.is_featured ?? false,
        is_active: payload.is_active ?? true
      })
      .returning("*");

    const variantRows = payload.weight_variants.map((variant) => ({
      product_id: product.id,
      label: variant.label,
      weight_grams: variant.weight_grams,
      price: variant.price,
      stock: variant.stock ?? 0
    }));
    await trx("weight_variants").insert(variantRows);

    return getProductById(product.id, true, trx);
  });
}

async function updateProduct(id, payload) {
  return db.transaction(async (trx) => {
    const existing = await trx("products").where({ id }).first();
    if (!existing) {
      throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }

    const updates = {
      updated_at: trx.fn.now()
    };

    if (payload.category_id) {
      const category = await trx("categories").where({ id: payload.category_id }).first();
      if (!category) {
        throw new ApiError(400, "Invalid category", "INVALID_CATEGORY");
      }
      updates.category_id = payload.category_id;
    }
    if (payload.name && payload.name !== existing.name) {
      updates.name = payload.name;
      updates.slug = await ensureUniqueSlug(payload.name, id);
    }
    if (Object.prototype.hasOwnProperty.call(payload, "description")) {
      updates.description = payload.description;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "base_price")) {
      updates.base_price = payload.base_price;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "stock")) {
      updates.stock = payload.stock;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "images")) {
      updates.images = payload.images;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "is_featured")) {
      updates.is_featured = payload.is_featured;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "is_active")) {
      updates.is_active = payload.is_active;
    }

    await trx("products").where({ id }).update(updates);

    if (payload.weight_variants) {
      await trx("weight_variants").where({ product_id: id }).del();
      const variantRows = payload.weight_variants.map((variant) => ({
        product_id: id,
        label: variant.label,
        weight_grams: variant.weight_grams,
        price: variant.price,
        stock: variant.stock ?? 0
      }));
      await trx("weight_variants").insert(variantRows);
    }

    return getProductById(id, true, trx);
  });
}

async function updateStock(id, stock) {
  const [updated] = await db("products")
    .where({ id })
    .update({ stock, updated_at: db.fn.now() })
    .returning("*");

  if (!updated) {
    throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
  }

  return getProductById(id, true);
}

async function softDeleteProduct(id) {
  const [updated] = await db("products")
    .where({ id })
    .update({ is_active: false, updated_at: db.fn.now() })
    .returning("id");

  if (!updated) {
    throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
  }
}

async function appendProductImage(id, imageUrl) {
  const product = await db("products").where({ id }).first();
  if (!product) {
    throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
  }

  const images = Array.isArray(product.images) ? product.images : [];
  const [updated] = await db("products")
    .where({ id })
    .update({
      images: [...images, imageUrl],
      updated_at: db.fn.now()
    })
    .returning("*");

  return updated;
}

module.exports = {
  listProducts,
  getFeaturedProducts,
  searchProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  updateStock,
  softDeleteProduct,
  appendProductImage
};
