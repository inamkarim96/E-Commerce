const { db } = require("../../config/db");
const redis = require("../../config/redis");
const ApiError = require("../../utils/apiError");

const GUEST_CART_TTL_SECONDS = 7 * 24 * 60 * 60;

function toNumber(value) {
  return Number(value || 0);
}

function buildGuestCartKey(sessionId) {
  return `cart:guest:${sessionId}`;
}

async function fetchVariantForCart(productId, variantId, trx = db) {
  return trx("weight_variants as w")
    .join("products as p", "w.product_id", "p.id")
    .where("w.id", variantId)
    .andWhere("p.id", productId)
    .andWhere("p.is_active", true)
    .select(
      "w.id as variant_id",
      "w.product_id",
      "w.label",
      "w.price",
      "w.stock",
      "p.id as product_id",
      "p.name as product_name",
      "p.images as product_images",
      "p.is_active"
    )
    .first();
}

async function getCartByUserId(userId, trx = db) {
  const rows = await trx("cart_items as ci")
    .join("products as p", "ci.product_id", "p.id")
    .join("weight_variants as w", "ci.variant_id", "w.id")
    .where("ci.user_id", userId)
    .where("p.is_active", true)
    .select(
      "ci.id",
      "ci.quantity",
      "p.id as product_id",
      "p.name as product_name",
      "p.images as product_images",
      "w.id as variant_id",
      "w.label as variant_label",
      "w.price as variant_price"
    )
    .orderBy("ci.created_at", "desc");

  let subtotal = 0;
  let itemCount = 0;

  const items = rows.map((row) => {
    const unitPrice = toNumber(row.variant_price);
    const quantity = toNumber(row.quantity);
    const itemTotal = unitPrice * quantity;
    subtotal += itemTotal;
    itemCount += quantity;

    return {
      id: row.id,
      product: {
        id: row.product_id,
        name: row.product_name,
        image: Array.isArray(row.product_images) ? row.product_images[0] || null : null
      },
      variant: {
        id: row.variant_id,
        label: row.variant_label,
        price: unitPrice
      },
      quantity,
      item_total: itemTotal
    };
  });

  return {
    items,
    subtotal,
    item_count: itemCount
  };
}

async function addItem(userId, payload) {
  return db.transaction(async (trx) => {
    const variant = await fetchVariantForCart(payload.product_id, payload.variant_id, trx);
    if (!variant) {
      throw new ApiError(404, "Product/variant not found or inactive", "INVALID_CART_ITEM");
    }

    const existing = await trx("cart_items")
      .where({
        user_id: userId,
        variant_id: payload.variant_id
      })
      .first();

    const newQuantity = (existing?.quantity || 0) + payload.quantity;
    if (toNumber(variant.stock) < newQuantity) {
      throw new ApiError(422, "Insufficient stock for requested quantity", "INSUFFICIENT_STOCK");
    }

    if (existing) {
      await trx("cart_items")
        .where({ id: existing.id })
        .update({
          quantity: newQuantity,
          updated_at: trx.fn.now()
        });
    } else {
      await trx("cart_items").insert({
        user_id: userId,
        product_id: payload.product_id,
        variant_id: payload.variant_id,
        quantity: payload.quantity
      });
    }

    return getCartByUserId(userId, trx);
  });
}

async function updateItemQuantity(userId, itemId, quantity) {
  return db.transaction(async (trx) => {
    const item = await trx("cart_items as ci")
      .join("products as p", "ci.product_id", "p.id")
      .join("weight_variants as w", "ci.variant_id", "w.id")
      .where("ci.id", itemId)
      .andWhere("ci.user_id", userId)
      .andWhere("p.is_active", true)
      .select(
        "ci.id",
        "ci.product_id",
        "ci.variant_id",
        "w.stock as variant_stock"
      )
      .first();

    if (!item) {
      throw new ApiError(404, "Cart item not found", "CART_ITEM_NOT_FOUND");
    }

    if (quantity === 0) {
      await trx("cart_items").where({ id: itemId, user_id: userId }).del();
      return getCartByUserId(userId, trx);
    }

    if (toNumber(item.variant_stock) < quantity) {
      throw new ApiError(422, "Insufficient stock for requested quantity", "INSUFFICIENT_STOCK");
    }

    await trx("cart_items")
      .where({ id: itemId, user_id: userId })
      .update({
        quantity,
        updated_at: trx.fn.now()
      });

    return getCartByUserId(userId, trx);
  });
}

async function removeItem(userId, itemId) {
  await db("cart_items").where({ id: itemId, user_id: userId }).del();
  return getCartByUserId(userId);
}

async function clearCart(userId) {
  await db("cart_items").where({ user_id: userId }).del();
  return getCartByUserId(userId);
}

async function getGuestCart(sessionId) {
  if (!redis || !sessionId) return [];
  const raw = await redis.get(buildGuestCartKey(sessionId));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

async function mergeGuestCart(userId, sessionId) {
  if (!sessionId) {
    return getCartByUserId(userId);
  }
  if (!redis) {
    throw new ApiError(503, "Redis is required for guest cart merge", "REDIS_UNAVAILABLE");
  }

  const guestItems = await getGuestCart(sessionId);
  if (!guestItems.length) {
    return getCartByUserId(userId);
  }

  const consolidated = new Map();
  for (const guestItem of guestItems) {
    if (!guestItem?.variant_id || !guestItem?.product_id || !guestItem?.quantity) continue;
    const current = consolidated.get(guestItem.variant_id) || {
      product_id: guestItem.product_id,
      variant_id: guestItem.variant_id,
      quantity: 0
    };
    current.quantity += toNumber(guestItem.quantity);
    consolidated.set(guestItem.variant_id, current);
  }

  const mergedItems = [...consolidated.values()];

  const cart = await db.transaction(async (trx) => {
    for (const item of mergedItems) {
      if (item.quantity <= 0) continue;

      const variant = await fetchVariantForCart(item.product_id, item.variant_id, trx);
      if (!variant) {
        throw new ApiError(404, "Guest cart contains invalid item", "INVALID_CART_ITEM");
      }

      const existing = await trx("cart_items")
        .where({
          user_id: userId,
          variant_id: item.variant_id
        })
        .first();

      const finalQuantity = toNumber(existing?.quantity || 0) + toNumber(item.quantity);
      if (toNumber(variant.stock) < finalQuantity) {
        throw new ApiError(
          422,
          "Insufficient stock while merging guest cart",
          "INSUFFICIENT_STOCK"
        );
      }

      if (existing) {
        await trx("cart_items")
          .where({ id: existing.id })
          .update({
            quantity: finalQuantity,
            updated_at: trx.fn.now()
          });
      } else {
        await trx("cart_items").insert({
          user_id: userId,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity
        });
      }
    }

    return getCartByUserId(userId, trx);
  });

  await redis.del(buildGuestCartKey(sessionId));
  return cart;
}

async function setGuestCart(sessionId, items) {
  if (!redis || !sessionId) return;
  await redis.set(
    buildGuestCartKey(sessionId),
    JSON.stringify(Array.isArray(items) ? items : []),
    "EX",
    GUEST_CART_TTL_SECONDS
  );
}

module.exports = {
  getCartByUserId,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  mergeGuestCart,
  getGuestCart,
  setGuestCart
};
