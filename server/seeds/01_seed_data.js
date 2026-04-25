const bcrypt = require('bcrypt');

exports.seed = async function (knex) {

  // Remove existing admin to prevent duplicate on re-run
  await knex('users')
    .where({ email: 'admin@naturadry.com' })
    .delete();

  // Hash password with bcrypt cost 12
  const password_hash = await bcrypt.hash('Admin@2026!', 12);

  // Insert the ONE admin user
  await knex('users').insert({
    name: 'NaturaDry Admin',
    email: 'admin@naturadry.com',
    password_hash,
    role: 'admin',
    is_active: true,
    email_verified: true,
    failed_login_attempts: 0,
  });

  // Keep any other existing seed data below this (categories, products etc.)
  // Do not remove or change anything else already in this file
};
