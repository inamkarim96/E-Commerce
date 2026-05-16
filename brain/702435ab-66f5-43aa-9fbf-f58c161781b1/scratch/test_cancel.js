const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mocking the ApiError
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function fetchOrderItems(orderId, client = prisma) {
  return client.order_items.findMany({
    where: { order_id: orderId },
    include: {
      products: { select: { slug: true } },
      weight_variants: { select: { label: true } }
    },
    orderBy: { id: "asc" }
  }).then(items => items.map(item => ({
    ...item,
    product_slug: item.products?.slug,
    variant_label: item.weight_variants?.label
  })));
}

async function fetchOrderById(orderId, client = prisma) {
  const order = await client.orders.findUnique({
    where: { id: orderId },
    include: {
      users: { select: { name: true, email: true } },
      payments: true,
      order_history: {
        include: { users: { select: { name: true } } },
        orderBy: { created_at: "desc" }
      }
    }
  });

  if (!order) throw new Error("Order not found");

  const items = await fetchOrderItems(order.id, client);
  return { ...order, items };
}

async function main() {
  const userId = '374a209c-e314-4f4d-aeda-fb99d4949e93';
  const orderId = '8fab1b3d-d1d3-406c-be33-d5be34bc6e76';

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.orders.findUnique({ where: { id: orderId } });
      if (!order || order.user_id !== userId) throw new Error("Not authorized");
      if (order.status !== "pending") throw new Error("Not pending");

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
    });
    console.log('Success:', result.status);
  } catch (error) {
    console.error('FAILED:', error);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
