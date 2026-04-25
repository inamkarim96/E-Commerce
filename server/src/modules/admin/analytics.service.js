const { db } = require("../../config/db");

async function getOverview() {
  const [revenueAndOrders] = await db("orders")
    .whereNot("status", "cancelled")
    .select(
      db.raw("SUM(total) as total_revenue"),
      db.raw("COUNT(id) as total_orders"),
      db.raw("AVG(total) as avg_order_value")
    );

  const [totalCustomers] = await db("users")
    .where("role", "customer")
    .count("id as count");

  const [pendingOrders] = await db("orders")
    .whereIn("status", ["pending", "processing"])
    .count("id as count");

  const [lowStockProducts] = await db("weight_variants")
    .where("stock", "<", 10)
    .count("id as count");

  return {
    total_revenue: parseFloat(revenueAndOrders.total_revenue || 0).toFixed(2),
    total_orders: parseInt(revenueAndOrders.total_orders || 0),
    total_customers: parseInt(totalCustomers.count || 0),
    avg_order_value: parseFloat(revenueAndOrders.avg_order_value || 0).toFixed(2),
    pending_orders: parseInt(pendingOrders.count || 0),
    low_stock_products: parseInt(lowStockProducts.count || 0),
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

  const query = db("orders")
    .whereNot("status", "cancelled")
    .select(
      db.raw(`DATE_TRUNC('${datePart}', created_at) as period_label`),
      db.raw("SUM(total) as revenue"),
      db.raw("COUNT(id) as order_count")
    )
    .groupBy("period_label")
    .orderBy("period_label", "asc");

  if (dateFrom) query.where("created_at", ">=", dateFrom);
  if (dateTo) query.where("created_at", "<=", dateTo);

  const result = await query;
  return result.map(row => ({
    period_label: row.period_label,
    revenue: parseFloat(row.revenue || 0).toFixed(2),
    order_count: parseInt(row.order_count || 0),
  }));
}

async function getTopProducts() {
  return db("order_items as oi")
    .join("orders as o", "oi.order_id", "o.id")
    .join("products as p", "oi.product_id", "p.id")
    .join("categories as c", "p.category_id", "c.id")
    .whereNot("o.status", "cancelled")
    .select(
      "p.name",
      "c.name as category_name",
      db.raw("SUM(oi.quantity) as total_quantity_sold"),
      db.raw("SUM(oi.subtotal) as total_revenue")
    )
    .groupBy("p.id", "p.name", "c.name")
    .orderBy("total_quantity_sold", "desc")
    .limit(10);
}

async function getInventoryAnalytics() {
  return db("weight_variants as wv")
    .join("products as p", "wv.product_id", "p.id")
    .where("wv.stock", "<", 10)
    .select(
      "p.name as product_name",
      "wv.label as variant_label",
      "wv.stock"
    )
    .orderBy("wv.stock", "asc");
}

module.exports = {
  getOverview,
  getRevenueAnalytics,
  getTopProducts,
  getInventoryAnalytics,
};
