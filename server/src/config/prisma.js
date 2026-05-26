const { PrismaClient } = require("@prisma/client");

const isDev = process.env.NODE_ENV === "development";

// Global singleton — prevents creating multiple PrismaClient instances
// during nodemon hot-reloads in development, which exhausts connection pools.
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient({
    log: isDev ? ["warn", "error"] : ["warn", "error"],
  });

if (isDev) {
  globalForPrisma.__prisma = prisma;
}

module.exports = prisma;
