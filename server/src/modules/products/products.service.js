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


async function getAllProductsFromDB() {
  const cacheKey = "products:all_active";
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const rows = await prisma.products.findMany({
    where: { is_active: true },
    select: {
      id: true,
      category_id: true,
      name: true,
      slug: true,
      description: true,
      base_price: true,
      stock: true,
      images: true,
      is_featured: true,
      is_active: true,
      created_at: true,
      updated_at: true,
      categories: true,
      weight_variants: {
        orderBy: { weight_grams: "asc" }
      }
    }
  });

  const productIds = rows.map((row) => row.id);
  const reviewMap = await fetchReviewStatsByProductIds(productIds);

  const products = rows.map((row) => mapProduct(row, reviewMap));
  
  await cache.set(cacheKey, products, "EX", 3600); // Cache for 1 hour
  return products;
}

async function listProducts(filters) {
  const cacheKey = `products:list:${JSON.stringify(filters)}`;
  const cachedData = await cache.get(cacheKey);
  if (cachedData) return cachedData;

  const where = { is_active: true };

  // Apply Search
  if (filters.q) {
    const q = filters.q.toLowerCase();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ];
  }

  // Filter by Category
  if (filters.category) {
    where.categories = { slug: filters.category };
  }

  // Filter by Price Range
  if (filters.min_price !== undefined || filters.max_price !== undefined) {
    where.base_price = {};
    if (filters.min_price !== undefined) where.base_price.gte = Number(filters.min_price);
    if (filters.max_price !== undefined) where.base_price.lte = Number(filters.max_price);
  }

  // Filter by Featured
  if (filters.featuredOnly) {
    where.is_featured = true;
  }

  // Filter by Stock
  if (filters.in_stock) {
    where.stock = { gt: 0 };
  }

  // Filter by Weight Variants
  if (filters.weight_label || filters.min_weight || filters.max_weight) {
    where.weight_variants = { some: {} };
    if (filters.weight_label) where.weight_variants.some.label = { contains: filters.weight_label, mode: 'insensitive' };
    if (filters.min_weight !== undefined) where.weight_variants.some.weight_grams = { gte: parseInt(filters.min_weight) };
    if (filters.max_weight !== undefined) where.weight_variants.some.weight_grams = { lte: parseInt(filters.max_weight) };
  }

  // Apply Sorting
  let orderBy = {};
  if (filters.sort === "price_asc") {
    orderBy = { base_price: "asc" };
  } else if (filters.sort === "price_desc") {
    orderBy = { base_price: "desc" };
  } else if (filters.sort === "name_asc") {
    orderBy = { name: "asc" };
  } else {
    // Default to newest
    orderBy = { created_at: "desc" };
  }

  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const skip = (page - 1) * limit;

  // For 'popular' sort, we need to sort by review_count which Prisma can't easily do in orderBy with aggregations directly on the relation. 
  // But we will fetch the data first, then sort if needed, or just ignore popular sort for now.
  // Actually, we can fetch all IDs, get reviews, and sort in memory if sort === 'popular', but for pagination, it's better to stick to Prisma.
  // Let's keep it simple and fast.
  const [total, rows] = await prisma.$transaction([
    prisma.products.count({ where }),
    prisma.products.findMany({
      where,
      select: {
        id: true,
        category_id: true,
        name: true,
        slug: true,
        description: true,
        base_price: true,
        stock: true,
        images: true,
        is_featured: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        categories: true,
        weight_variants: {
          orderBy: { weight_grams: "asc" }
        }
      },
      orderBy: filters.sort !== 'popular' ? orderBy : undefined,
      take: filters.sort === 'popular' ? undefined : limit,
      skip: filters.sort === 'popular' ? undefined : skip
    })
  ]);

  let paginatedRows = rows;

  const productIds = paginatedRows.map(r => r.id);
  const reviewMap = await fetchReviewStatsByProductIds(productIds);

  let products = paginatedRows.map((row) => mapProduct(row, reviewMap));

  if (filters.sort === 'popular') {
    products.sort((a, b) => Number(b.review_count || 0) - Number(a.review_count || 0));
    paginatedRows = products.slice(skip, skip + limit);
    products = paginatedRows;
  }

  const result = {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / limit)
    }
  };

  const ttl = filters.featuredOnly ? 120 : 60;
  await cache.set(cacheKey, result, "EX", ttl);

  return result;
}

async function listAdminProducts(filters) {
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const skip = (page - 1) * limit;

  const cacheKey = `products:admin:list:${JSON.stringify(filters)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [total, rows] = await prisma.$transaction([
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

  const cacheKey = `products:search:${q}:${pageNum}:${limitNum}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

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

  const result = {
    products: rows.map((row) => mapProduct(row, reviewMap)),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / limitNum)
    }
  };

  await cache.set(cacheKey, result, "EX", 30);
  return result;
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

  if (!includeInactive) {
    const allProducts = await getAllProductsFromDB();
    const found = allProducts.find(p => p.id === id);
    if (found) {
      await cache.set(cacheKey, found, "EX", 300);
      return found;
    }
  }

  const result = await _getProductByIdWithClient(prisma, id, includeInactive);
  await cache.set(cacheKey, result, "EX", 300);
  return result;
}

async function getProductBySlug(slug) {
  const cacheKey = `product:slug:${slug}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const allProducts = await getAllProductsFromDB();
  const found = allProducts.find(p => p.slug === slug);
  if (found) {
    await cache.set(cacheKey, found, "EX", 300);
    return found;
  }

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

    await cache.del("products:all_active");
    await cache.clearPattern("products:list");
    await cache.clearPattern("products:search");
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

    if (payload.weight_variants && payload.weight_variants.length > 0) {
      data.stock = payload.weight_variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);

      const incomingIds = payload.weight_variants.map(v => v.id).filter(Boolean);
      
      // 1. Delete variants that were removed in UI
      await tx.weight_variants.deleteMany({
        where: {
          product_id: id,
          id: { notIn: incomingIds }
        }
      }).catch(err => {
        // If deletion fails (e.g. referenced in orders), we just skip it
        // This prevents 500 errors while maintaining data integrity
        console.warn(`Could not delete some variants for product ${id}:`, err.message);
      });

      // 2. Separate create and update
      for (const v of payload.weight_variants) {
        const variantData = {
          label: v.label,
          weight_grams: v.weight_grams,
          price: v.price,
          stock: v.stock ?? 0
        };

        if (v.id) {
          await tx.weight_variants.update({
            where: { id: v.id },
            data: variantData
          });
        } else {
          await tx.weight_variants.create({
            data: {
              ...variantData,
              product_id: id
            }
          });
        }
      }
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

async function deleteProduct(id) {
  try {
    const existing = await prisma.products.findUnique({ where: { id } });
    await prisma.products.delete({
      where: { id }
    });
    await Promise.all([
      cache.del("products:all_active"),
      cache.clearPattern("products:list"),
      cache.clearPattern("products:admin:list"),
      cache.clearPattern("products:search"),
      cache.clearPattern(`product:id:${id}`),
      existing ? cache.del(`product:slug:${existing.slug}`) : Promise.resolve()
    ]);
  } catch (err) {
    if (err.code === "P2025") {
      throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }
    if (err.code === "P2003") {
      throw new ApiError(400, "Cannot permanently delete product because it is linked to existing orders. You should deactivate it instead.", "DELETE_RESTRICTED");
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
  getAllProductsFromDB,
  listProducts,
  listAdminProducts,
  getFeaturedProducts,
  searchProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
  appendProductImage
};
