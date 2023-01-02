const { encrypt } = require('../knex/users')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async (knex) => {
  await knex('users').del()
  await knex('users').insert([
    { username: 'user', encryptedPassword: await encrypt('password') }
  ])
}
