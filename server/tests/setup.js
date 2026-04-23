const { db } = require("../src/config/db");
const redis = require("../src/config/redis");
const knexConfig = require("../knexfile");

// Mocking external services
jest.mock("@sendgrid/mail", () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }]),
}));

jest.mock("cloudinary", () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({ secure_url: "https://mock-image.com" }),
      destroy: jest.fn().mockResolvedValue({ result: "ok" }),
    },
  },
}));

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ client_secret: "mock_secret" }),
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: "payment_intent.succeeded",
        data: { object: { metadata: { order_id: 1 }, amount: 1000 } },
      }),
    },
  }));
});

// Mock JazzCash package if it's used
jest.mock("@zfhassaan/jazzcash", () => {
  return jest.fn().mockImplementation(() => ({
    initiateTransaction: jest.fn().mockResolvedValue({ pp_ResponseCode: "000", pp_ResponseMessage: "Success" }),
  }));
});

// Mock Redis
jest.mock("../src/config/redis", () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  quit: jest.fn(),
  on: jest.fn(),
}));

beforeAll(async () => {
  // Run migrations
  await db.migrate.latest();
});

afterEach(async () => {
  // Clear all tables except migrations
  const tables = await db.raw(
    "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE 'knex_migration%'"
  );
  
  for (const { tablename } of tables.rows) {
    await db.raw(`TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE`);
  }
});

afterAll(async () => {
  await db.destroy();
  if (redis) {
    await redis.quit();
  }
});
