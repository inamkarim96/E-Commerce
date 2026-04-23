const bcrypt = require("bcrypt");

/**
 * @param {import('knex').Knex} knex
 */
exports.seed = async function seed(knex) {
  await knex("reviews").del();
  await knex("cart_items").del();
  await knex("payments").del();
  await knex("order_items").del();
  await knex("orders").del();
  await knex("coupons").del();
  await knex("addresses").del();
  await knex("weight_variants").del();
  await knex("products").del();
  await knex("categories").del();
  await knex("users").del();

  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);

  await knex("users").insert({
    name: "NaturaDry Admin",
    email: "admin@naturadry.com",
    password_hash: adminPasswordHash,
    role: "admin",
    is_active: true,
    email_verified: true
  });

  const categoryRows = await knex("categories")
    .insert([
      { name: "Nuts", slug: "nuts" },
      { name: "Honey", slug: "honey" },
      { name: "Beans", slug: "beans" },
      { name: "Berries", slug: "berries" }
    ])
    .returning(["id", "slug"]);

  const categoryMap = categoryRows.reduce((acc, row) => {
    acc[row.slug] = row.id;
    return acc;
  }, {});

  const productRows = await knex("products")
    .insert([
      {
        category_id: categoryMap.nuts,
        name: "Premium Almonds",
        slug: "premium-almonds",
        description: "Raw premium almonds packed fresh for everyday snacking.",
        base_price: 850,
        stock: 120,
        images: [
          "https://images.naturadry.com/products/premium-almonds-1.jpg"
        ],
        is_featured: true,
        is_active: true
      },
      {
        category_id: categoryMap.honey,
        name: "Organic Sidr Honey",
        slug: "organic-sidr-honey",
        description: "Pure sidr honey sourced from trusted natural farms.",
        base_price: 1200,
        stock: 80,
        images: [
          "https://images.naturadry.com/products/organic-sidr-honey-1.jpg"
        ],
        is_featured: true,
        is_active: true
      },
      {
        category_id: categoryMap.berries,
        name: "Dried Cranberries",
        slug: "dried-cranberries",
        description: "Sweet and tangy dried cranberries for snacks and baking.",
        base_price: 650,
        stock: 150,
        images: [
          "https://images.naturadry.com/products/dried-cranberries-1.jpg"
        ],
        is_featured: false,
        is_active: true
      }
    ])
    .returning(["id", "slug"]);

  const productMap = productRows.reduce((acc, row) => {
    acc[row.slug] = row.id;
    return acc;
  }, {});

  await knex("weight_variants").insert([
    {
      product_id: productMap["premium-almonds"],
      label: "250g",
      weight_grams: 250,
      price: 850,
      stock: 50
    },
    {
      product_id: productMap["premium-almonds"],
      label: "500g",
      weight_grams: 500,
      price: 1600,
      stock: 40
    },
    {
      product_id: productMap["premium-almonds"],
      label: "1kg",
      weight_grams: 1000,
      price: 3000,
      stock: 30
    },
    {
      product_id: productMap["organic-sidr-honey"],
      label: "250g",
      weight_grams: 250,
      price: 1200,
      stock: 35
    },
    {
      product_id: productMap["organic-sidr-honey"],
      label: "500g",
      weight_grams: 500,
      price: 2300,
      stock: 30
    },
    {
      product_id: productMap["organic-sidr-honey"],
      label: "1kg",
      weight_grams: 1000,
      price: 4400,
      stock: 15
    },
    {
      product_id: productMap["dried-cranberries"],
      label: "250g",
      weight_grams: 250,
      price: 650,
      stock: 60
    },
    {
      product_id: productMap["dried-cranberries"],
      label: "500g",
      weight_grams: 500,
      price: 1200,
      stock: 50
    },
    {
      product_id: productMap["dried-cranberries"],
      label: "1kg",
      weight_grams: 1000,
      price: 2200,
      stock: 40
    }
  ]);
};
