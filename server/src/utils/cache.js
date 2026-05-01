const cacheStore = new Map();

const cache = {
  async get(key) {
    return cacheStore.get(key) || null;
  },
  async set(key, value, ex, ttl) {
    cacheStore.set(key, value);
    if (ex === "EX" && ttl) {
      setTimeout(() => cacheStore.delete(key), ttl * 1000);
    }
    return "OK";
  },
  async del(key) {
    return cacheStore.delete(key) ? 1 : 0;
  },
  async clearPattern(pattern) {
    let count = 0;
    for (const key of cacheStore.keys()) {
      if (key.startsWith(pattern)) {
        cacheStore.delete(key);
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
