/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable("coupons", (table) => {
    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("gen_random_uuid()"));
    table.string("code", 50).notNullable().unique();
    table
      .enu("type", ["percentage", "fixed"], {
        useNative: true,
        enumName: "coupon_type"
      })
      .notNullable();
    table.decimal("value", 10, 2).notNullable();
    table.decimal("min_order_amount", 10, 2).notNullable().defaultTo(0);
    table.integer("max_uses").nullable();
    table.integer("used_count").notNullable().defaultTo(0);
    table.timestamp("expires_at", { useTz: true }).nullable();
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("coupons");
  await knex.raw("DROP TYPE IF EXISTS coupon_type");
};
