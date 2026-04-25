const request = require("supertest");
const app = require("../src/app");
const { db } = require("../src/config/db");

describe("Auth Module", () => {
  const testUser = {
    name: "your name  Doe",
    email: "your name @example.com",
    password: "Password123!",
    phone: "+92-300-1112222",
  };

  describe("POST /auth/register", () => {
    it("should return 201 with user object on valid data", async () => {
      const res = await request(app)
        .post("egister")
        .send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user).not.toHaveProperty("password_hash");
    });

    it("should return 409 if email already exists", async () => {
      await request(app).post("egister").send(testUser);
      const res = await request(app)
        .post("egister")
        .send(testUser);

      expect(res.statusCode).toBe(409);
    });

    it("should return 400 if password too weak", async () => {
      const res = await request(app)
        .post("egister")
        .send({ ...testUser, password: "123" });

      expect(res.statusCode).toBe(400);
    });

    it("should return 400 if email invalid", async () => {
      const res = await request(app)
        .post("egister")
        .send({ ...testUser, email: "invalid-email" });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      await request(app).post("egister").send(testUser);
    });

    it("should return 200 with accessToken on valid credentials", async () => {
      const res = await request(app)
        .post("ogin")
        .send({ email: testUser.email, password: testUser.password });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty("accessToken");
      expect(res.headers).toHaveProperty("set-cookie");
    });

    it("should return 401 on wrong password", async () => {
      const res = await request(app)
        .post("ogin")
        .send({ email: testUser.email, password: "WrongPassword!" });

      expect(res.statusCode).toBe(401);
    });

    it("should return 401 on non-existent email", async () => {
      const res = await request(app)
        .post("ogin")
        .send({ email: "nobody@example.com", password: testUser.password });

      expect(res.statusCode).toBe(401);
    });
  });
});
