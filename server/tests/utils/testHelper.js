const { v4: uuidv4 } = require("uuid");
const request = require("supertest");
const app = require("../../src/app");
const { db } = require("../../src/config/db");

const registerAndLogin = async (userData = {}) => {
  const defaultUser = {
    name: "Test User",
    email: `test-${uuidv4()}@example.com`,
    password: "Password123!",
    phone: "+92-300-1234567",
  };

  const userPayload = { ...defaultUser, ...userData };

  await request(app).post("/api/v1/auth/register").send(userPayload);

  // Manually update role if needed because register service hardcodes it to 'customer'
  if (userData.role) {
    await db("users").where({ email: userPayload.email }).update({ role: userData.role });
  }

  const loginRes = await request(app).post("/api/v1/auth/login").send({
    email: userPayload.email,
    password: userPayload.password,
  });

  if (!loginRes.body.data) {
    throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
  }

  return {
    accessToken: loginRes.body.data.accessToken,
    user: loginRes.body.data.user,
    cookie: loginRes.headers["set-cookie"],
  };
};

module.exports = {
  registerAndLogin,
};
