/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.table("orders", (table) => {
    table.text("admin_notes").nullable();
  });

  await knex.schema.createTable("order_history", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("order_id").notNullable().references("id").inTable("orders").onDelete("CASCADE");
    table.string("status_from", 50).nullable();
    table.string("status_to", 50).notNullable();
    table.uuid("changed_by").nullable().references("id").inTable("users");
    table.text("notes").nullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("order_history");
  await knex.schema.table("orders", (table) => {
    table.dropColumn("admin_notes");
  });
};
