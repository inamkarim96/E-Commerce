const request = require("supertest");
const app = require("../src/app");
const { db } = require("../src/config/db");
const { registerAndLogin } = require("./utils/testHelper");

describe("Reviews Module", () => {
  let userToken;
  let productId;

  beforeEach(async () => {
    const login = await registerAndLogin();
    userToken = login.accessToken;

    const [cat] = await db("categories").insert({ name: "C1", slug: "c1" }).returning("*");
    const [prod] = await db("products").insert({
      name: "P1",
      slug: "p1",
      category_id: cat.id,
      base_price: 100
    }).returning("*");
    productId = prod.id;
  });

  describe("POST /reviews", () => {
    it("should fail if user has not purchased product", async () => {
      const res = await request(app)
        .post("s")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          product_id: productId,
          rating: 5,
          title: "Bad",
          body: "Great!"
        });

      expect(res.statusCode).toBe(403);
    });

    it("should succeed if user has purchased product", async () => {
      const jwt = require("jsonwebtoken");
      const userId = jwt.decode(userToken).sub;

      const [order] = await db("orders").insert({
        user_id: userId,
        status: "delivered",
        subtotal: 100,
        total: 100,
        shipping_address: JSON.stringify({ name: "Test" })
      }).returning("*");

      await db("order_items").insert({
        order_id: order.id,
        product_id: productId,
        product_name: "P1",
        quantity: 1,
        unit_price: 100,
        subtotal: 100
      });

      const res = await request(app)
        .post("s")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          product_id: productId,
          rating: 5,
          title: "Verified",
          body: "Verified purchase!"
        });

      expect(res.statusCode).toBe(201);
    });
  });

  describe("GET /reviews/product/:productId", () => {
    it("should return reviews for a product", async () => {
      const res = await request(app).get(`s/product/${productId}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.reviews)).toBe(true);
    });
  });
});
