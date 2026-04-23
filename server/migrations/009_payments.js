/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable("payments", (table) => {
    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("order_id")
      .notNullable()
      .unique()
      .references("id")
      .inTable("orders");
    table
      .enu("gateway", ["jazzcash", "easypaisa", "stripe", "cod"], {
        useNative: true,
        enumName: "payment_gateway"
      })
      .notNullable();
    table.string("transaction_id", 255).nullable();
    table.decimal("amount", 10, 2).notNullable();
    table
      .enu("status", ["pending", "completed", "failed", "refunded"], {
        useNative: true,
        enumName: "payment_status"
      })
      .notNullable()
      .defaultTo("pending");
    table.jsonb("gateway_resp").nullable();
    table.timestamp("paid_at", { useTz: true }).nullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("payments");
  await knex.raw("DROP TYPE IF EXISTS payment_status");
  await knex.raw("DROP TYPE IF EXISTS payment_gateway");
};
