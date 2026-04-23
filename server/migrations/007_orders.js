/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable("orders", (table) => {
    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("user_id").notNullable().references("id").inTable("users");
    table
      .enu("status", ["pending", "processing", "shipped", "delivered", "cancelled"], {
        useNative: true,
        enumName: "order_status"
      })
      .notNullable()
      .defaultTo("pending");
    table.decimal("subtotal", 10, 2).notNullable();
    table.decimal("shipping_fee", 10, 2).notNullable().defaultTo(0);
    table.decimal("discount", 10, 2).notNullable().defaultTo(0);
    table.decimal("total", 10, 2).notNullable();
    table.jsonb("shipping_address").notNullable();
    table.string("coupon_code", 50).nullable();
    table.string("tracking_number", 100).nullable();
    table.string("courier", 100).nullable();
    table.text("notes").nullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("orders");
  await knex.raw("DROP TYPE IF EXISTS order_status");
};
