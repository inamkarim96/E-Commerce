const app = require("./app");

const { PORT } = require("./config/env");
const prisma = require("./config/prisma");
const productsService = require("./modules/products/products.service");
const categoriesService = require("./modules/categories/categories.service");

async function warmCache() {
  try {
    console.log("Warming cache...");
    await categoriesService.listCategories();
    
    // Fetch all active products into the in-memory catalog
    await productsService.getAllProductsFromDB();
    
    console.log("Cache warmed successfully.");
  } catch (err) {
    console.warn("Cache warm-up failed (non-fatal):", err.message);
  }
}

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Connected to PostgreSQL via Prisma");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      // Pre-warm cache in the background after server is ready
      warmCache();
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
