const request = require("supertest");
const app = require("../src/app");
const { db } = require("../src/config/db");
const { registerAndLogin } = require("./utils/testHelper");

describe("Orders Module", () => {
  let userToken;
  let userId;
  let variantId;
  let productId;

  beforeEach(async () => {
    // Get tokens
    const login = await registerAndLogin();
    userToken = login.accessToken;
    userId = login.user.id;

    const [cat] = await db("categories").insert({ name: "Herbs", slug: `herbs-${Date.now()}-${Math.random()}` }).returning("*");
    const [prod] = await db("products").insert({
      name: "Test Herb",
      slug: `test-herb-${Date.now()}-${Math.random()}`,
      category_id: cat.id,
      is_active: true,
      base_price: 1000
    }).returning("*");
    productId = prod.id;

    const [variant] = await db("weight_variants").insert({
      product_id: productId,
      label: "100g",
      price: 1000,
      stock: 10,
      weight_grams: 100
    }).returning("*");
    variantId = variant.id;

    // Add to cart
    await db("cart_items").insert({
      user_id: userId,
      product_id: productId,
      variant_id: variantId,
      quantity: 2
    });
  });

  describe("POST /orders", () => {
    it("should create order from cart and clear cart", async () => {
      const res = await request(app)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          payment_method: "cod",
          shipping_address: { full_name: "Test", phone: "+92-300-1112222", address_line: "123 Street", city: "Lahore", province: "Punjab", postal_code: "54000", country: "PK" }
        });

      expect(res.statusCode).toBe(201);
      
      const cartCount = await db("cart_items").where({ user_id: userId }).count({ count: "*" }).first();
      expect(Number(cartCount.count)).toBe(0);

      const variant = await db("weight_variants").where({ id: variantId }).first();
      expect(variant.stock).toBe(8); // 10 - 2
    });

    it("should return 422 if stock insufficient", async () => {
      await db("cart_items").where({ variant_id: variantId }).update({ quantity: 100 });

      const res = await request(app)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          payment_method: "cod",
          shipping_address: { full_name: "Test", phone: "+92-300-1112222", address_line: "123 Street", city: "Lahore", province: "Punjab", postal_code: "54000", country: "PK" }
        });

      expect(res.statusCode).toBe(422);
    });
  });

  describe("POST /orders/:id/cancel", () => {
    it("should cancel pending order", async () => {
      const orderRes = await request(app)
        .post("/api/v1/orders")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          payment_method: "cod",
          shipping_address: { full_name: "Test", phone: "+92-300-1112222", address_line: "123 Street", city: "Lahore", province: "Punjab", postal_code: "54000", country: "PK" }
        });
      
      const orderId = orderRes.body.data.order.id;

      const res = await request(app)
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      
      const updatedOrder = await db("orders").where({ id: orderId }).first();
      expect(updatedOrder.status).toBe("cancelled");
    });
  });
});
