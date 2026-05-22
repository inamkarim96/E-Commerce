const { PrismaClient } = require("@prisma/client");

const isDev = process.env.NODE_ENV === "development";

const prisma = new PrismaClient({
  log: isDev ? ["query", "info", "warn", "error"] : ["warn", "error"],
});

module.exports = prisma;
