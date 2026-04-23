const knex = require("knex");
const { DATABASE_URL, NODE_ENV } = require("./env");

const db = knex({
  client: "pg",
  connection: DATABASE_URL,
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    directory: "./migrations"
  },
  seeds: {
    directory: "./seeds"
  },
  debug: NODE_ENV === "development"
});

async function connectDatabase() {
  await db.raw("SELECT 1");
  console.log("Database connected");
}

module.exports = {
  db,
  connectDatabase
};
