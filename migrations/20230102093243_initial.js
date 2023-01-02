/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('users', (t) => {
    t.increments('userId').primary()
    t.string('username').unique()
    t.string('encryptedPassword').notNullable()
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return Promise.all([knex.schema.dropTable('users')])
}
