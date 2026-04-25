const request = require("supertest");
const app = require("../src/app");
const { db } = require("../src/config/db");
const { registerAndLogin } = require("./utils/testHelper");

describe("Admin Analytics Module", () => {
  let adminToken;

  beforeEach(async () => {
    const admin = await registerAndLogin({ email: `admin-analytics-${Date.now()}@naturadry.com`, role: "admin" });
    adminToken = admin.accessToken;

    // Seed some data for analytics
    const [cat] = await db("categories").insert({ name: "Herbs", slug: "herbs" }).returning("*");
    const [prod] = await db("products").insert({
      name: "Low Stock Item",
      slug: "low-stock",
      category_id: cat.id,
      base_price: 100,
      stock: 5
    }).returning("*");

    await db("weight_variants").insert({
      product_id: prod.id,
      label: "100g",
      weight_grams: 100,
      price: 100,
      stock: 5
    });

    const user = await db("users").first();

    await db("orders").insert([
      {
        user_id: user.id,
        subtotal: 1000,
        total: 1000,
        status: "delivered",
        shipping_address: JSON.stringify({ name: "T1" })
      },
      {
        user_id: user.id,
        subtotal: 500,
        total: 500,
        status: "pending",
        shipping_address: JSON.stringify({ name: "T2" })
      }
    ]);
  });

  describe("GET /admin/analytics/overview", () => {
    it("should return business overview for admin", async () => {
      const res = await request(app)
        .get("/admin/analytics/overview")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty("total_revenue");
      expect(Number(res.body.data.low_stock_products)).toBeGreaterThanOrEqual(1);
    });

    it("should deny access to regular users", async () => {
      const user = await registerAndLogin();
      const res = await request(app)
        .get("/admin/analytics/overview")
        .set("Authorization", `Bearer ${user.accessToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe("GET /admin/analytics/top-products", () => {
    it("should return top products", async () => {
      const res = await request(app)
        .get("/admin/analytics/top-products")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
