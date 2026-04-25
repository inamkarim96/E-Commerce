const request = require("supertest");
const app = require("../src/app");
const { db } = require("../src/config/db");
const { registerAndLogin } = require("./utils/testHelper");

describe("Users Module", () => {
  let userToken;
  let userId;

  beforeEach(async () => {
    const login = await registerAndLogin();
    userToken = login.accessToken;
    userId = login.user.id;
  });

  describe("GET /users/me", () => {
    it("should return user profile", async () => {
      const res = await request(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(userId);
    });
  });

  describe("PUT /users/me", () => {
    it("should update user profile", async () => {
      const res = await request(app)
        .put("/users/me")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "Updated Name" });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe("Updated Name");
    });
  });

  describe("Address Management", () => {
    it("should add a new address", async () => {
      const res = await request(app)
        .post("/users/me/addresses")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          full_name: "Test Address",
          phone: "+92-300-1112222",
          address_line: "Street 1",
          city: "Lahore",
          province: "Punjab",
          postal_code: "54000",
          country: "PK",
          is_default: true
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.is_default).toBe(true);
    });

    it("should list user addresses", async () => {
      await db("addresses").insert({
        user_id: userId,
        full_name: "A1",
        phone: "+923000000000",
        address_line: "L1",
        city: "C1",
        province: "P1",
        postal_code: "111",
        country: "PK"
      });

      const res = await request(app)
        .get("/users/me/addresses")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });
});
