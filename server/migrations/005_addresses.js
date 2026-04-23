/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable("addresses", (table) => {
    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("full_name", 100).nullable();
    table.string("phone", 20).nullable();
    table.text("address_line").nullable();
    table.string("city", 100).nullable();
    table.string("province", 100).nullable();
    table.string("postal_code", 20).nullable();
    table.string("country", 10).notNullable().defaultTo("PK");
    table.boolean("is_default").notNullable().defaultTo(false);
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("addresses");
};
