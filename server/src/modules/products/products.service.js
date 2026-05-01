const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");
const slugify = require("../../utils/slugify");
const cache = require("../../utils/cache");

async function ensureUniqueSlug(name, excludeId = null) {
  const baseSlug = slugify(name);
  let slug = baseSlug;

  for (let i = 0; i < 15; i += 1) {
    const existing = await prisma.products.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {})
      },
      select: { id: true }
    });
    if (!existing) return slug;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  throw new ApiError(500, "Unable to generate product slug", "SLUG_GENERATION_FAILED");
}


async function fetchReviewStatsByProductIds(productIds) {
  if (!productIds.length) return {};

  const stats = await prisma.reviews.groupBy({
    by: ["product_id"],
    where: { product_id: { in: productIds } },
    _avg: { rating: true },
    _count: { id: true }
  });

  return stats.reduce((acc, row) => {
    acc[row.product_id] = {
      avg_rating: row._avg.rating ? Number(row._avg.rating.toFixed(1)) : 0,
      review_count: Number(row._count.id || 0)
    };
    return acc;
  }, {});
}

function mapProduct(row, reviewMap) {
  const review = reviewMap[row.id] || { avg_rating: 0, review_count: 0 };
  return {
    ...row,
    category: row.categories,
    weight_variants: row.weight_variants || [],
    avg_rating: review.avg_rating,
    review_count: review.review_count
  };
}


async function listProducts(filters) {
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const skip = (page - 1) * limit;

  const where = { is_active: true };

  // Search by name or description
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: 'insensitive' } },
      { description: { contains: filters.q, mode: 'insensitive' } }
    ];
  }

  // Filter by category slug
  if (filters.category) {
    where.categories = { slug: filters.category };
  }

  // Filter by price range
  if (filters.min_price !== undefined || filters.max_price !== undefined) {
    where.base_price = {};
    if (filters.min_price !== undefined) {
      where.base_price.gte = filters.min_price;
    }
    if (filters.max_price !== undefined) {
      where.base_price.lte = filters.max_price;
    }
  }

  // Filter by featured
  if (filters.featuredOnly) {
    where.is_featured = true;
  }

  // Filter by weight variant
  if (filters.weight_label || filters.min_weight || filters.max_weight) {
    where.weight_variants = {
      some: {
        AND: [
          filters.weight_label ? { label: { contains: filters.weight_label, mode: 'insensitive' } } : {},
          filters.min_weight ? { weight_grams: { gte: parseInt(filters.min_weight) } } : {},
          filters.max_weight ? { weight_grams: { lte: parseInt(filters.max_weight) } } : {}
        ].filter(Boolean)
      }
    };
  }

  // Filter by stock availability
  if (filters.in_stock) {
    where.stock = { gt: 0 };
  }

  let orderBy = { created_at: "desc" };
  if (filters.sort === "price_asc") {
    orderBy = { base_price: "asc" };
  } else if (filters.sort === "price_desc") {
    orderBy = { base_price: "desc" };
  } else if (filters.sort === "popular") {
    orderBy = { reviews: { _count: "desc" } };
  } else if (filters.sort === "name_asc") {
    orderBy = { name: "asc" };
  }

  // Generate cache key based on filters
  const cacheKey = `products:list:${JSON.stringify(filters)}`;
  const cachedData = await cache.get(cacheKey);
  if (cachedData) return cachedData;

  const [total, rows] = await Promise.all([
    prisma.products.count({ where }),
    prisma.products.findMany({
      where,
      include: {
        categories: true,
        weight_variants: {
          orderBy: { weight_grams: "asc" }
        }
      },
      orderBy,
      take: limit,
      skip
    })
  ]);

  const productIds = rows.map((row) => row.id);
  const reviewMap = await fetchReviewStatsByProductIds(productIds);

  const products = rows.map((row) => mapProduct(row, reviewMap));
  const result = {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / limit)
    }
  };

  // Cache the result for 5 minutes
  await cache.set(cacheKey, result, "EX", 300);

  return result;
}

async function listAdminProducts(filters) {
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const skip = (page - 1) * limit;

  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [total, rows] = await Promise.all([
    prisma.products.count(),
    prisma.products.findMany({
      include: {
        categories: true,
        weight_variants: {
          orderBy: { weight_grams: "asc" }
        }
      },
      orderBy: { created_at: "desc" },
      take: limit,
      skip
    })
  ]);

  const productIds = rows.map((row) => row.id);
  const reviewMap = await fetchReviewStatsByProductIds(productIds);

  const products = rows.map((row) => mapProduct(row, reviewMap));
  const result = {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / limit)
    }
  };
  await cache.set(cacheKey, result, "EX", 300);
  return result;
}

async function getFeaturedProducts() {
  return listProducts({ page: 1, limit: 20, sort: "newest", featuredOnly: true }).then(
    (result) => result.products
  );
}

async function searchProducts({ q, page, limit }) {
  const pageNum = Number(page || 1);
  const limitNum = Number(limit || 10);
  const skip = (pageNum - 1) * limitNum;

  const where = {
    is_active: true,
    OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ]
  };

  const [total, rows] = await prisma.$transaction([
    prisma.products.count({ where }),
    prisma.products.findMany({
      where,
      include: {
        categories: true,
        weight_variants: {
          orderBy: { weight_grams: "asc" }
        }
      },
      orderBy: { created_at: "desc" },
      take: limitNum,
      skip
    })
  ]);

  const ids = rows.map((row) => row.id);
  const reviewMap = await fetchReviewStatsByProductIds(ids);

  return {
    products: rows.map((row) => mapProduct(row, reviewMap)),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / limitNum)
    }
  };
}

async function _getProductByIdWithClient(client, id, includeInactive = false) {
  const row = await client.products.findUnique({
    where: {
      id,
      ...(includeInactive ? {} : { is_active: true })
    },
    include: {
      categories: true,
      weight_variants: {
        orderBy: { weight_grams: "asc" }
      }
    }
  });

  if (!row) {
    throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
  }

  const reviewMap = await fetchReviewStatsByProductIds([row.id]);
  return mapProduct(row, reviewMap);
}

async function getProductById(id, includeInactive = false) {
  const cacheKey = `product:id:${id}:${includeInactive}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const result = await _getProductByIdWithClient(prisma, id, includeInactive);
  await cache.set(cacheKey, result, "EX", 300);
  return result;
}

async function getProductBySlug(slug) {
  const cacheKey = `product:slug:${slug}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const row = await prisma.products.findUnique({
    where: { slug, is_active: true },
    select: { id: true }
  });
  if (!row) {
    throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
  }
  const result = await getProductById(row.id);
  await cache.set(cacheKey, result, "EX", 300);
  return result;
}

async function createProduct(payload) {
  return prisma.$transaction(async (tx) => {
    // Validate category only if provided
    if (payload.category_id) {
      const category = await tx.categories.findUnique({
        where: { id: payload.category_id }
      });
      if (!category) {
        throw new ApiError(400, "Invalid category", "INVALID_CATEGORY");
      }
    }

    const slug = await ensureUniqueSlug(payload.name);
    const totalVariantStock = payload.weight_variants?.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0) || 0;

    const product = await tx.products.create({
      data: {
        category_id: payload.category_id || null,
        name: payload.name,
        slug,
        description: payload.description || null,
        base_price: payload.base_price,
        stock: payload.weight_variants?.length > 0 ? totalVariantStock : (payload.stock ?? 0),
        images: payload.images || [],
        is_featured: payload.is_featured ?? false,
        is_active: payload.is_active ?? true,
        weight_variants: {
          create: payload.weight_variants?.map((v) => ({
            label: v.label,
            weight_grams: v.weight_grams,
            price: v.price,
            stock: v.stock ?? 0
          })) || []
        }
      }
    });

    await cache.clearPattern("products:list");
    return _getProductByIdWithClient(tx, product.id, true);
  });
}

async function updateProduct(id, payload) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.products.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }

    const data = {
      updated_at: new Date()
    };

    if (payload.category_id !== undefined) {
      if (payload.category_id) {
        const category = await tx.categories.findUnique({ where: { id: payload.category_id } });
        if (!category) {
          throw new ApiError(400, "Invalid category", "INVALID_CATEGORY");
        }
        data.category_id = payload.category_id;
      } else {
        // Allow clearing category
        data.category_id = null;
      }
    }
    if (payload.name && payload.name !== existing.name) {
      data.name = payload.name;
      data.slug = await ensureUniqueSlug(payload.name, id);
    }
    if (Object.prototype.hasOwnProperty.call(payload, "description")) {
      data.description = payload.description;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "base_price")) {
      data.base_price = payload.base_price;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "stock")) {
      data.stock = payload.stock;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "images")) {
      data.images = payload.images;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "is_featured")) {
      data.is_featured = payload.is_featured;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "is_active")) {
      data.is_active = payload.is_active;
    }

    if (payload.weight_variants?.length > 0) {
      data.stock = payload.weight_variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);

      // Update variants: delete and recreate for simplicity
      await tx.weight_variants.deleteMany({ where: { product_id: id } });
      data.weight_variants = {
        create: payload.weight_variants.map((v) => ({
          label: v.label,
          weight_grams: v.weight_grams,
          price: v.price,
          stock: v.stock ?? 0
        }))
      };
    }

    await tx.products.update({
      where: { id },
      data
    });

    await Promise.all([
      cache.clearPattern("products:list"),
      cache.clearPattern("products:admin:list"),
      cache.clearPattern(`product:id:${id}`),
      cache.del(`product:slug:${existing.slug}`)
    ]);
    return _getProductByIdWithClient(tx, id, true);
  });
}

async function updateStock(id, stock) {
  try {
    await prisma.products.update({
      where: { id },
      data: { stock, updated_at: new Date() }
    });
    return getProductById(id, true);
  } catch (err) {
    if (err.code === "P2025") {
      throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }
    throw err;
  }
}

async function softDeleteProduct(id) {
  try {
    await prisma.products.update({
      where: { id },
      data: { is_active: false, updated_at: new Date() }
    });
    await cache.clearPattern("products:list");
  } catch (err) {
    if (err.code === "P2025") {
      throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }
    throw err;
  }
}

async function appendProductImage(id, imageUrl) {
  const product = await prisma.products.findUnique({ where: { id } });
  if (!product) {
    throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
  }

  const images = Array.isArray(product.images) ? product.images : [];
  return prisma.products.update({
    where: { id },
    data: {
      images: [...images, imageUrl],
      updated_at: new Date()
    }
  });
}

module.exports = {
  listProducts,
  listAdminProducts,
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
