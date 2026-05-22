const app = require("./app");

const { PORT } = require("./config/env");
const prisma = require("./config/prisma");
const productsService = require("./modules/products/products.service");
const categoriesService = require("./modules/categories/categories.service");

async function warmCache() {
  try {
    console.log("Warming cache...");
    await categoriesService.listCategories();
    
    // Use the exact defaults the validation schema applies (sort: "newest")
    const result = await productsService.listProducts({ page: 1, limit: 20, sort: "newest" });
    
    // Pre-warm the cache for individual products shown on the first page
    if (result && result.products) {
      for (const product of result.products) {
        await productsService.getProductBySlug(product.slug).catch(() => {});
      }
    }
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
