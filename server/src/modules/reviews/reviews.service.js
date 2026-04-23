const { db } = require("../../config/db");
const redis = require("../../config/redis");
const ApiError = require("../../utils/apiError");

async function updateProductRatingCache(productId) {
  if (!redis) return;

  const result = await db("reviews")
    .where({ product_id: productId })
    .avg("rating as avg_rating")
    .count("id as total_count")
    .first();

  const avgRating = parseFloat(result.avg_rating || 0).toFixed(1);
  const totalCount = parseInt(result.total_count || 0);

  await redis.set(`product:rating:${productId}`, JSON.stringify({ avg_rating: avgRating, total_count: totalCount }), "EX", 3600);
}

async function getProductReviews(productId, { page = 1, limit = 10 }) {
  const offset = (page - 1) * limit;

  const reviews = await db("reviews as r")
    .join("users as u", "r.user_id", "u.id")
    .where("r.product_id", productId)
    .select(
      "r.id",
      "r.rating",
      "r.title",
      "r.body",
      "r.created_at",
      "u.name as user_name"
    )
    .orderBy("r.created_at", "desc")
    .limit(limit)
    .offset(offset);

  const stats = await db("reviews")
    .where({ product_id: productId })
    .avg("rating as avg_rating")
    .count("id as total_count")
    .first();

  return {
    reviews,
    avg_rating: parseFloat(stats.avg_rating || 0).toFixed(1),
    total_count: parseInt(stats.total_count || 0),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit)
    }
  };
}

async function createReview(userId, { product_id, rating, title, body }) {
  // Purchase verification
  const purchase = await db("orders as o")
    .join("order_items as oi", "o.id", "oi.order_id")
    .where("o.user_id", userId)
    .where("oi.product_id", product_id)
    .where("o.status", "delivered")
    .first();

  if (!purchase) {
    throw new ApiError(403, "You can only review products you have purchased and received.", "PURCHASE_REQUIRED");
  }

  // Duplicate check
  const existing = await db("reviews")
    .where({ user_id: userId, product_id })
    .first();

  if (existing) {
    throw new ApiError(409, "You have already reviewed this product.", "DUPLICATE_REVIEW");
  }

  const [review] = await db("reviews")
    .insert({
      user_id: userId,
      product_id,
      rating,
      title,
      body,
      created_at: db.fn.now()
    })
    .returning("*");

  // Recalculate and cache
  await updateProductRatingCache(product_id);

  return review;
}

async function deleteReview(userId, reviewId) {
  const review = await db("reviews").where({ id: reviewId }).first();
  if (!review) {
    throw new ApiError(404, "Review not found", "NOT_FOUND");
  }

  if (review.user_id !== userId) {
    throw new ApiError(403, "Not authorized to delete this review", "FORBIDDEN");
  }

  await db("reviews").where({ id: reviewId }).del();
  await updateProductRatingCache(review.product_id);
}

async function adminDeleteReview(reviewId) {
  const review = await db("reviews").where({ id: reviewId }).first();
  if (!review) {
    throw new ApiError(404, "Review not found", "NOT_FOUND");
  }

  await db("reviews").where({ id: reviewId }).del();
  await updateProductRatingCache(review.product_id);
}

module.exports = {
  getProductReviews,
  createReview,
  deleteReview,
  adminDeleteReview,
};
