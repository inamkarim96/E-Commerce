/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable("users", (table) => {
    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("gen_random_uuid()"));
    table.string("name", 100).notNullable();
    table.string("email", 255).notNullable().unique();
    table.string("password_hash", 255).notNullable();
    table
      .enu("role", ["customer", "admin"], {
        useNative: true,
        enumName: "user_role"
      })
      .notNullable()
      .defaultTo("customer");
    table.string("phone", 20).nullable();
    table.boolean("is_active").notNullable().defaultTo(true);
    table.boolean("email_verified").notNullable().defaultTo(false);
    table
      .integer("failed_login_attempts")
      .notNullable()
      .defaultTo(0);
    table.timestamp("locked_until", { useTz: true }).nullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("users");
  await knex.raw("DROP TYPE IF EXISTS user_role");
};
