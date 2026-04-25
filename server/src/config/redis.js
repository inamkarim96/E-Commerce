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
  console.warn("REDIS_URL not set. Using in-memory mock for Redis.");
  const store = new Map();
  redis = {
    async get(key) { return store.get(key) || null; },
    async set(key, value, ex, ttl) { 
      store.set(key, String(value)); 
      if (ex === "EX" && ttl) {
        setTimeout(() => store.delete(key), ttl * 1000);
      }
      return "OK"; 
    },
    async del(key) { store.delete(key); return 1; }
  };
}

module.exports = redis;
