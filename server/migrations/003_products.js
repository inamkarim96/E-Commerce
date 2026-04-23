/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable("products", (table) => {
    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("category_id").notNullable().references("id").inTable("categories");
    table.string("name", 200).notNullable();
    table.string("slug", 220).notNullable().unique();
    table.text("description").nullable();
    table.decimal("base_price", 10, 2).notNullable();
    table.integer("stock").notNullable().defaultTo(0);
    table.specificType("images", "text[]").nullable();
    table.boolean("is_featured").notNullable().defaultTo(false);
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("products");
};
