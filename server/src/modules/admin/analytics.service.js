const prisma = require("../../config/prisma");

async function getOverview() {
  const revenueAndOrders = await prisma.orders.aggregate({
    where: { NOT: { status: "cancelled" } },
    _sum: { total: true },
    _count: { id: true },
    _avg: { total: true }
  });

  const totalCustomers = await prisma.users.count({
    where: { role: "customer" }
  });

  const pendingOrders = await prisma.orders.count({
    where: { status: { in: ["pending", "processing"] } }
  });

  const lowStockProducts = await prisma.weight_variants.count({
    where: { stock: { lt: 10 } }
  });

  return {
    total_revenue: parseFloat(revenueAndOrders._sum.total || 0).toFixed(2),
    total_orders: revenueAndOrders._count.id,
    total_customers: totalCustomers,
    avg_order_value: parseFloat(revenueAndOrders._avg.total || 0).toFixed(2),
    pending_orders: pendingOrders,
    low_stock_products: lowStockProducts,
  };
}

async function getRevenueAnalytics(period = "daily", dateFrom, dateTo) {
  let datePart;
  switch (period) {
    case "weekly":
      datePart = "week";
      break;
    case "monthly":
      datePart = "month";
      break;
    default:
      datePart = "day";
  }

  // Use raw query for DATE_TRUNC as Prisma doesn't support it in groupBy yet
  const result = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC(${datePart}, created_at) as period_label,
      SUM(total) as revenue,
      COUNT(id) as order_count
    FROM orders
    WHERE status != 'cancelled'
    ${dateFrom ? prisma.sql`AND created_at >= ${new Date(dateFrom)}` : prisma.sql``}
    ${dateTo ? prisma.sql`AND created_at <= ${new Date(dateTo)}` : prisma.sql``}
    GROUP BY period_label
    ORDER BY period_label ASC
  `;

  return result.map(row => ({
    period_label: row.period_label,
    revenue: parseFloat(row.revenue || 0).toFixed(2),
    order_count: Number(row.order_count || 0),
  }));
}

async function getTopProducts() {
  const result = await prisma.order_items.groupBy({
    by: ["product_id", "product_name"],
    where: {
      orders: {
        status: { not: "cancelled" }
      }
    },
    _sum: {
      quantity: true,
      subtotal: true
    },
    orderBy: {
      _sum: {
        quantity: "desc"
      }
    },
    take: 10
  });

  // Fetch category info separately if needed or rely on product_id
  return result.map(r => ({
    name: r.product_name,
    total_quantity_sold: r._sum.quantity,
    total_revenue: parseFloat(r._sum.subtotal || 0).toFixed(2)
  }));
}

async function getInventoryAnalytics() {
  return prisma.weight_variants.findMany({
    where: { stock: { lt: 10 } },
    include: { products: { select: { name: true } } },
    orderBy: { stock: "asc" }
  }).then(items => items.map(wv => ({
    product_name: wv.products.name,
    variant_label: wv.label,
    stock: wv.stock
  })));
}

module.exports = {
  getOverview,
  getRevenueAnalytics,
  getTopProducts,
  getInventoryAnalytics,
};
