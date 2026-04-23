const Redis = require("ioredis");
const { REDIS_URL } = require("./env");

let redis = null;

if (REDIS_URL) {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true
  });

  redis.on("connect", () => {
    console.log("Redis connected");
  });

  redis.on("error", (error) => {
    console.error("Redis connection error:", error?.message || error);
  });
} else {
  console.warn("REDIS_URL not set. Redis-dependent features are disabled.");
}

module.exports = redis;
