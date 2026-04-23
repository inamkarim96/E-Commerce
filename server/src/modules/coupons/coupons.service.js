const { db } = require("../../config/db");
const ApiError = require("../../utils/apiError");

function toNumber(value) {
  return Number(value || 0);
}

async function validateCoupon(code, subtotal) {
  const coupon = await db("coupons").where({ code }).first();

  if (!coupon) {
    return { valid: false, reason: "Invalid coupon code" };
  }

  if (!coupon.is_active) {
    return { valid: false, reason: "Coupon is inactive" };
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, reason: "Coupon has expired" };
  }

  if (coupon.max_uses !== null && toNumber(coupon.used_count) >= toNumber(coupon.max_uses)) {
    return { valid: false, reason: "Coupon usage limit reached" };
  }

  if (toNumber(subtotal) < toNumber(coupon.min_order_amount)) {
    return { valid: false, reason: `Order does not meet minimum amount of Rs. ${coupon.min_order_amount}` };
  }

  let discount_amount = 0;
  if (coupon.type === "percentage") {
    discount_amount = (toNumber(subtotal) * toNumber(coupon.value)) / 100;
  } else {
    discount_amount = toNumber(coupon.value);
  }

  if (discount_amount > subtotal) discount_amount = subtotal;

  return {
    valid: true,
    type: coupon.type,
    value: coupon.value,
    discount_amount
  };
}

async function listAllCoupons() {
  return db("coupons").orderBy("created_at", "desc");
}

async function createCoupon(data) {
  const existing = await db("coupons").where({ code: data.code }).first();
  if (existing) {
    throw new ApiError(409, "Coupon code already exists", "DUPLICATE_COUPON");
  }

  const [coupon] = await db("coupons")
    .insert({
      ...data,
      created_at: db.fn.now()
    })
    .returning("*");

  return coupon;
}

async function updateCoupon(id, data) {
  const [coupon] = await db("coupons")
    .where({ id })
    .update({
      ...data,
      updated_at: db.fn.now()
    })
    .returning("*");

  if (!coupon) {
    throw new ApiError(404, "Coupon not found", "NOT_FOUND");
  }

  return coupon;
}

async function deactivateCoupon(id) {
  const [coupon] = await db("coupons")
    .where({ id })
    .update({
      is_active: false,
      updated_at: db.fn.now()
    })
    .returning("*");

  if (!coupon) {
    throw new ApiError(404, "Coupon not found", "NOT_FOUND");
  }

  return coupon;
}

module.exports = {
  validateCoupon,
  listAllCoupons,
  createCoupon,
  updateCoupon,
  deactivateCoupon,
};
