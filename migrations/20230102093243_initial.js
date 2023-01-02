/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.all([
    knex.schema.createTable('users', (t) => {
      t.increments('userId').primary()
      t.string('username').unique()
      t.string('encryptedPassword').notNullable()
    }),
    knex.schema.createTable('feeds', (t) => {
      t.increments('feedId').primary()
      t.integer('userId').index()
      t.string('link').notNullable()
      t.string('title').notNullable()
    }),
    knex.schema.createTable('items', (t) => {
      t.increments('itemId').primary()
      t.integer('feedId').index()
      t.string('title')
      t.string('link')
      t.string('content')
      t.datetime('pubDate')
      t.string('author')
      t.string('guid')
    })
  ])
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.all(
    ['users', 'feeds', 'items'].map((t) => knex.schema.dropTable(t))
  )
}
