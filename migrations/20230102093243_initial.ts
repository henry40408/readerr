import { Knex } from 'knex'

export function up(knex: Knex) {
  return Promise.all([
    knex.schema.createTable('users', (t) => {
      t.increments('userId').primary()
      t.string('username').notNullable().unique()
      t.string('encryptedPassword').notNullable()
    }),
    knex.schema.createTable('feeds', (t) => {
      t.increments('feedId').primary()
      t.integer('userId').notNullable().index()
      t.string('feedUrl').notNullable()
      t.string('link').notNullable()
      t.string('title').notNullable()
    }),
    knex.schema.createTable('items', (t) => {
      t.increments('itemId').primary()
      t.integer('feedId').notNullable().index()
      t.string('title')
      t.string('link')
      t.string('content')
      t.datetime('pubDate')
      t.string('author')
      t.string('guid').notNullable()
      t.unique(['feedId', 'guid'])
    })
  ])
}

export function down(knex: Knex) {
  return Promise.all(
    ['users', 'feeds', 'items'].map((t) => knex.schema.dropTable(t))
  )
}
