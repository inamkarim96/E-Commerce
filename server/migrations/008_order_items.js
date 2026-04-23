/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable("order_items", (table) => {
    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("order_id")
      .notNullable()
      .references("id")
      .inTable("orders")
      .onDelete("CASCADE");
    table.uuid("product_id").notNullable().references("id").inTable("products");
    table
      .uuid("variant_id")
      .nullable()
      .references("id")
      .inTable("weight_variants");
    table.string("product_name", 200).notNullable();
    table.integer("quantity").notNullable();
    table.decimal("unit_price", 10, 2).notNullable();
    table.decimal("subtotal", 10, 2).notNullable();
  });

  await knex.raw(
    "ALTER TABLE order_items ADD CONSTRAINT order_items_quantity_positive CHECK (quantity > 0)"
  );
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("order_items");
};
