const NodeCache = require("node-cache");

const cacheStore = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const cache = {
  async get(key) {
    return cacheStore.get(key) || null;
  },
  async set(key, value, ex, ttl) {
    if (ex === "EX" && ttl) {
      cacheStore.set(key, value, ttl);
    } else {
      cacheStore.set(key, value);
    }
    return "OK";
  },
  async del(key) {
    const deleted = cacheStore.del(key);
    return deleted > 0 ? 1 : 0;
  },
  async clearPattern(pattern) {
    let count = 0;
    const keys = cacheStore.keys();
    for (const key of keys) {
      if (key.startsWith(pattern)) {
        cacheStore.del(key);
        count++;
      }
    }
    return count;
  },
  on: () => {},
  once: () => {},
  status: "ready"
};

module.exports = cache;
