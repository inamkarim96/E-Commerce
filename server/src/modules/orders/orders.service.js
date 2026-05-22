const sgMail = require("@sendgrid/mail");
const prisma = require("../../config/prisma");
const cache = require("../../utils/cache");
const ApiError = require("../../utils/apiError");
const { SENDGRID_API_KEY, SENDGRID_FROM_EMAIL } = require("../../config/env");

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const STATUS_TRANSITIONS = {
  pending: ["processing", "cancelled"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: []
};

function toNumber(value) {
  return Number(value || 0);
}

function buildPaymentUrl(orderId, paymentMethod) {
  return `/payments/${paymentMethod}/${orderId}`;
}

function sendOrderEmailAsync({ to, subject, text, html }) {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL || !to) return;
  sgMail
    .send({ to, from: SENDGRID_FROM_EMAIL, subject, text, html })
    .catch((error) => console.error("Order email send failed:", error?.message || error));
}

async function fetchOrderById(orderId, client = prisma) {
  // Single query with all relations included — eliminates N+1 pattern
  const order = await client.orders.findUnique({
    where: { id: orderId },
    include: {
      users: {
        select: { name: true, email: true }
      },
      payments: true,
      order_items: {
        include: {
          products: {
            select: { slug: true }
          },
          weight_variants: {
            select: { label: true }
          }
        },
        orderBy: { id: "asc" }
      },
      order_history: {
        include: {
          users: {
            select: { name: true }
          }
        },
        orderBy: { created_at: "desc" }
      }
    }
  });

  if (!order) {
    throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
  }

  const items = order.order_items.map(item => ({
    ...item,
    product_slug: item.products?.slug,
    variant_label: item.weight_variants?.label
  }));

  return {
    ...order,
    user_name: order.users?.name,
    user_email: order.users?.email,
    payment_id: order.payments?.id,
    payment_gateway: order.payments?.gateway,
    payment_transaction_id: order.payments?.transaction_id,
    payment_amount: order.payments?.amount,
    payment_status: order.payments?.status,
    payment_paid_at: order.payments?.paid_at,
    items,
    history: order.order_history.map(h => ({
      ...h,
      changed_by_name: h.users?.name
    }))
  };
}

async function listOwnOrders(userId, { page, limit }) {
  const pageNum = Number(page || 1);
  const limitNum = Number(limit || 10);
  const skip = (pageNum - 1) * limitNum;

  const cacheKey = `orders:own:${userId}:${pageNum}:${limitNum}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const [total, rows] = await prisma.$transaction([
    prisma.orders.count({ where: { user_id: userId } }),
    prisma.orders.findMany({
      where: { user_id: userId },
      include: {
        _count: {
          select: { order_items: true }
        },
        payments: true
      },
      orderBy: { created_at: "desc" },
      take: limitNum,
      skip
    })
  ]);

  const result = {
    orders: rows.map(r => ({
      ...r,
      items_count: r._count.order_items
    })),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / limitNum)
    }
  };

  await cache.set(cacheKey, result, "EX", 15);
  return result;
}

async function getOwnOrder(userId, orderId) {
  const order = await fetchOrderById(orderId);
  if (order.user_id !== userId) {
    throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
  }
  return order;
}

async function validateCoupon(couponCode, subtotal) {
  if (!couponCode) {
    return { discount: 0, coupon: null };
  }

  const coupon = await prisma.coupons.findUnique({
    where: { code: couponCode }
  });
  if (!coupon) {
    throw new ApiError(400, "Invalid coupon code", "INVALID_COUPON");
  }
  if (!coupon.is_active) {
    throw new ApiError(400, "Coupon is inactive", "INVALID_COUPON");
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    throw new ApiError(400, "Coupon has expired", "INVALID_COUPON");
  }
  if (coupon.max_uses !== null && Number(coupon.used_count) >= Number(coupon.max_uses)) {
    throw new ApiError(400, "Coupon usage limit reached", "INVALID_COUPON");
  }
  if (toNumber(subtotal) < toNumber(coupon.min_order_amount)) {
    throw new ApiError(400, "Order does not meet coupon minimum amount", "INVALID_COUPON");
  }

  let discount = 0;
  if (coupon.type === "percentage") {
    discount = (toNumber(subtotal) * toNumber(coupon.value)) / 100;
  } else {
    discount = toNumber(coupon.value);
  }
  if (discount > subtotal) discount = subtotal;

  return { discount, coupon };
}

function invalidateOrderCaches(userId) {
  return Promise.all([
    cache.clearPattern(`orders:own:${userId}`),
    cache.clearPattern("orders:admin:")
  ]);
}

async function createOrderFromCart(userId, payload) {
  const result = await prisma.$transaction(async (tx) => {
    let cartItems = await tx.cart_items.findMany({
      where: {
        user_id: userId,
        products: { is_active: true }
      },
      include: {
        products: { select: { name: true } },
        weight_variants: { select: { label: true, price: true, stock: true } }
      }
    }).then(items => items.map(ci => ({
      product_id: ci.product_id,
      variant_id: ci.variant_id,
      quantity: ci.quantity,
      product_name: ci.products.name,
      variant_label: ci.weight_variants.label,
      variant_price: ci.weight_variants.price,
      variant_stock: ci.weight_variants.stock
    })));

    // FALLBACK
    if (!cartItems.length && payload.items && payload.items.length) {
      for (const item of payload.items) {
        let variantId = item.variant_id || (typeof item.weight === 'object' ? item.weight.id : null);
        
        if (!variantId && typeof item.weight === 'object' && item.weight.label) {
          const matchedVariant = await tx.weight_variants.findFirst({
            where: { product_id: item.product_id, label: item.weight.label }
          });
          if (matchedVariant) variantId = matchedVariant.id;
        }

        if (!variantId) throw new ApiError(400, "Missing variant_id for item", "INVALID_PAYLOAD");

        const details = await tx.weight_variants.findUnique({
          where: { id: variantId },
          include: { products: { select: { name: true, is_active: true } } }
        });

        if (!details || !details.products.is_active) {
          throw new ApiError(404, `Product/Variant not found: ${variantId}`, "NOT_FOUND");
        }

        cartItems.push({
          product_id: details.product_id,
          variant_id: details.id,
          quantity: item.quantity,
          product_name: details.products.name,
          variant_label: details.label,
          variant_price: details.price,
          variant_stock: details.stock
        });
      }
    }

    if (!cartItems.length) {
      throw new ApiError(400, "Cart is empty", "EMPTY_CART");
    }

    for (const item of cartItems) {
      if (toNumber(item.variant_stock) < toNumber(item.quantity)) {
        throw new ApiError(422, `Insufficient stock for ${item.product_name}`, "INSUFFICIENT_STOCK");
      }
    }

    const subtotal = cartItems.reduce((sum, item) => sum + toNumber(item.quantity) * toNumber(item.variant_price), 0);
    const { discount, coupon } = await validateCoupon(payload.coupon_code, subtotal);
    const shippingFee = subtotal >= 2000 ? 0 : 150;
    const total = subtotal + shippingFee - discount;

    const order = await tx.orders.create({
      data: {
        user_id: userId,
        status: "pending",
        subtotal,
        shipping_fee: shippingFee,
        discount,
        total,
        shipping_address: payload.shipping_address,
        coupon_code: coupon?.code || null,
        notes: payload.notes || null,
        order_items: {
          create: cartItems.map(item => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.variant_price,
            subtotal: toNumber(item.quantity) * toNumber(item.variant_price)
          }))
        },
        payments: {
          create: {
            gateway: payload.payment_method,
            amount: total,
            status: "pending"
          }
        }
      },
      include: { payments: true }
    });

    // Update stocks
    for (const item of cartItems) {
      await tx.weight_variants.update({
        where: { id: item.variant_id },
        data: { stock: { decrement: item.quantity } }
      });
      await tx.products.update({
        where: { id: item.product_id },
        data: { stock: { decrement: item.quantity } }
      });
    }

    if (coupon) {
      await tx.coupons.update({
        where: { id: coupon.id },
        data: { used_count: { increment: 1 } }
      });
    }

    await tx.cart_items.deleteMany({ where: { user_id: userId } });

    return {
      orderId: order.id,
      paymentUrl: buildPaymentUrl(order.id, payload.payment_method),
      payment: order.payments,
      subtotal,
      total
    };
  }, {
    maxWait: 5000,
    timeout: 20000
  });

  // Invalidate caches after successful order creation
  await invalidateOrderCaches(userId);

  const order = await fetchOrderById(result.orderId);

  sendOrderEmailAsync({
    to: order.user_email,
    subject: `Order confirmation - ${order.id}`,
    text: `Your KarakoramStore order has been placed. Status: ${order.status}`,
    html: `<p>Your KarakoramStore order has been placed.</p><p>Order ID: <strong>${order.id}</strong></p><p>Status: ${order.status}</p>`
  });

  return {
    order,
    payment_url: result.paymentUrl
  };
}

async function cancelOwnOrder(userId, orderId) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.orders.findUnique({
        where: { id: orderId }
      });
      if (!order || order.user_id !== userId) {
        throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
      }
      if (order.status !== "pending") {
        throw new ApiError(400, "Only pending orders can be cancelled", "INVALID_ORDER_STATE");
      }

      await tx.orders.update({
        where: { id: orderId },
        data: { status: "cancelled", updated_at: new Date() }
      });

      const items = await tx.order_items.findMany({ where: { order_id: orderId } });
      for (const item of items) {
        if (item.variant_id) {
          await tx.weight_variants.update({
            where: { id: item.variant_id },
            data: { stock: { increment: item.quantity } }
          });
        }
        await tx.products.update({
          where: { id: item.product_id },
          data: { stock: { increment: item.quantity } }
        });
      }

      const updated = await fetchOrderById(orderId, tx);
      return updated;
    }, {
      maxWait: 5000,
      timeout: 20000
    });

    await invalidateOrderCaches(userId);
    return result;
  } catch (error) {
    console.error(`[cancelOwnOrder ERROR] Order: ${orderId}, User: ${userId}`, error);
    throw error;
  }
}

async function listAdminOrders(filters) {
  const page = Number(filters.page || 1);
  const limit = Number(filters.limit || 10);
  const skip = (page - 1) * limit;

  const cacheKey = `orders:admin:${JSON.stringify(filters)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.user_id) where.user_id = filters.user_id;
  if (filters.date_from || filters.date_to) {
    where.created_at = {};
    if (filters.date_from) where.created_at.gte = new Date(filters.date_from);
    if (filters.date_to) where.created_at.lte = new Date(filters.date_to);
  }
  
  if (filters.search) {
    where.OR = [
      { users: { name: { contains: filters.search, mode: 'insensitive' } } },
      { users: { email: { contains: filters.search, mode: 'insensitive' } } }
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.orders.count({ where }),
    prisma.orders.findMany({
      where,
      include: {
        users: { select: { name: true, email: true } },
        _count: { select: { order_items: true } }
      },
      orderBy: { created_at: "desc" },
      take: limit,
      skip
    })
  ]);

  const result = {
    orders: rows.map(r => ({
      ...r,
      user_name: r.users?.name,
      user_email: r.users?.email,
      items_count: r._count.order_items
    })),
    pagination: {
      page,
      limit,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / limit)
    }
  };

  await cache.set(cacheKey, result, "EX", 30);
  return result;
}

async function updateOrderStatusByAdmin(orderId, payload, adminId) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.orders.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
    }

    const allowed = STATUS_TRANSITIONS[order.status] || [];
    if (!allowed.includes(payload.status)) {
      throw new ApiError(400, `Invalid status transition`, "INVALID_ORDER_STATE");
    }

    const data = {
      status: payload.status,
      updated_at: new Date()
    };
    
    if (payload.status === "shipped") {
      data.tracking_number = payload.tracking_number || null;
      data.courier = payload.courier || null;
    }

    await tx.orders.update({
      where: { id: orderId },
      data
    });

    if (payload.status === "cancelled" && order.status !== "cancelled") {
      const items = await tx.order_items.findMany({ where: { order_id: orderId } });
      for (const item of items) {
        await tx.weight_variants.update({
          where: { id: item.variant_id },
          data: { stock: { increment: item.quantity } }
        });
        await tx.products.update({
          where: { id: item.product_id },
          data: { stock: { increment: item.quantity } }
        });
      }
    }

    return fetchOrderById(orderId, tx);
  });

  // Invalidate caches
  await Promise.all([
    cache.clearPattern(`orders:own:`),
    cache.clearPattern("orders:admin:")
  ]);

  return result;
}

async function getAdminOrder(orderId) {
  return fetchOrderById(orderId);
}

async function updateOrderAdminNotes(orderId, notes) {
  await prisma.orders.update({
    where: { id: orderId },
    data: { admin_notes: notes, updated_at: new Date() }
  });
  return fetchOrderById(orderId);
}

async function deleteOwnOrder(userId, orderId) {
  const order = await prisma.orders.findUnique({
    where: { id: orderId }
  });

  if (!order || order.user_id !== userId) {
    throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
  }

  if (order.status !== "cancelled" && order.status !== "delivered") {
    throw new ApiError(400, "Only cancelled or delivered orders can be deleted from history", "INVALID_ORDER_STATE");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Delete payments first because of foreign key constraint
    await tx.payments.deleteMany({
      where: { order_id: orderId }
    });

    await tx.orders.delete({
      where: { id: orderId }
    });

    return { success: true };
  });

  await invalidateOrderCaches(userId);
  return result;
}

module.exports = {
  listOwnOrders,
  getOwnOrder,
  createOrderFromCart,
  cancelOwnOrder,
  deleteOwnOrder,
  listAdminOrders,
  getAdminOrder,
  updateOrderStatusByAdmin,
  updateOrderAdminNotes
};
