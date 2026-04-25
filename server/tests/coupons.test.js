const request = require("supertest");
const app = require("../src/app");
const { db } = require("../src/config/db");
const { registerAndLogin } = require("./utils/testHelper");

describe("Coupons Module", () => {
  let adminToken;
  let userToken;

  beforeEach(async () => {
    const admin = await registerAndLogin({ email: `admin-coupon-${Date.now()}@naturadry.com`, role: "admin" });
    adminToken = admin.accessToken;

    const user = await registerAndLogin();
    userToken = user.accessToken;
  });

  describe("POST /coupons/admin", () => {
    it("should create a new coupon", async () => {
      const res = await request(app)
        .post("s/admin")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          code: "SAVE20",
          type: "percentage",
          value: 20,
          min_order_amount: 1000,
          expires_at: new Date(Date.now() + 86400000).toISOString()
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.code).toBe("SAVE20");
    });
  });

  describe("POST /coupons/validate", () => {
    it("should validate a valid coupon", async () => {
      await db("coupons").insert({
        code: "VALID10",
        type: "fixed",
        value: 100,
        min_order_amount: 500,
        is_active: true,
        expires_at: new Date(Date.now() + 86400000)
      });

      const res = await request(app)
        .post("s/validate")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ code: "VALID10", order_subtotal: 600 });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.valid).toBe(true);
      expect(Number(res.body.data.value)).toBe(100);
    });

    it("should return invalid for low order amount", async () => {
      await db("coupons").insert({
        code: "MIN1000",
        type: "percentage",
        value: 10,
        min_order_amount: 1000,
        is_active: true,
        expires_at: new Date(Date.now() + 86400000)
      });

      const res = await request(app)
        .post("s/validate")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ code: "MIN1000", order_subtotal: 500 });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.valid).toBe(false);
      expect(res.body.data.reason).toMatch(/minimum amount/);
    });
  });
});
