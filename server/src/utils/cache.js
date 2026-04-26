const cacheStore = new Map();

const cache = {
  async get(key) {
    return cacheStore.get(key) || null;
  },
  async set(key, value, ex, ttl) {
    cacheStore.set(key, String(value));
    if (ex === "EX" && ttl) {
      setTimeout(() => cacheStore.delete(key), ttl * 1000);
    }
    return "OK";
  },
  async del(key) {
    return cacheStore.delete(key) ? 1 : 0;
  },
  on: () => {},
  once: () => {},
  status: "ready"
};

module.exports = cache;
