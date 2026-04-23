const request = require("supertest");
const app = require("../src/app");
const { db } = require("../src/config/db");
const { registerAndLogin } = require("./utils/testHelper");

describe("Products Module", () => {
  let adminToken;
  let customerToken;
  let category;

  beforeEach(async () => {
    // Setup categories
    const [cat] = await db("categories").insert({ name: "Herbs", slug: "herbs" }).returning("*");
    category = cat;

    // Get tokens
    const admin = await registerAndLogin({ email: `admin-prod-${Date.now()}@naturadry.com`, role: "admin" });
    adminToken = admin.accessToken;

    const customer = await registerAndLogin({ email: `customer-${Date.now()}@gmail.com`, role: "customer" });
    customerToken = customer.accessToken;

    // Create some products
    await db("products").insert([
      { name: "Dried Basil", slug: "dried-basil", category_id: category.id, description: "Pure basil", is_active: true, base_price: 500 },
      { name: "Dried Oregano", slug: "dried-oregano", category_id: category.id, description: "Pure oregano", is_active: true, base_price: 600 },
    ]);
  });

  describe("GET /products", () => {
    it("should return paginated list", async () => {
      const res = await request(app).get("/api/v1/products");
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.products)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });

    it("should filter by category slug", async () => {
      const res = await request(app).get("/api/v1/products?category=herbs");
      expect(res.statusCode).toBe(200);
      res.body.data.products.forEach(p => {
        expect(p.category.slug).toBe("herbs");
      });
    });
  });

  describe("POST /products (admin)", () => {
    it("should create product with variants as admin", async () => {
      const res = await request(app)
        .post("/api/v1/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "New Product",
          description: "Desc",
          category_id: category.id,
          base_price: 500,
          weight_variants: [{ label: "100g", price: 500, stock: 50, weight_grams: 100 }]
        });

      expect(res.statusCode).toBe(201);
    });

    it("should return 403 for customer token", async () => {
      const res = await request(app)
        .post("/api/v1/products")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ name: "Fail" });

      expect(res.statusCode).toBe(403);
    });
  });
});
