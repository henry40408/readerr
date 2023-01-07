import { Knex } from 'knex'

export function up(knex: Knex) {
  return Promise.all([
    knex.schema.createTable('users', (t) => {
      t.increments('userId').primary()
      t.string('username').notNullable().unique()
      t.string('encryptedPassword').notNullable()
      t.timestamps(false, true, true)
    }),
    knex.schema.createTable('feeds', (t) => {
      t.increments('feedId').primary()
      t.integer('userId').notNullable()
      t.string('feedUrl').notNullable()
      t.string('link').notNullable()
      t.string('title').notNullable()
      t.timestamp('refreshedAt').notNullable().defaultTo(knex.fn.now())
      t.timestamps(false, true, true)

      t.unique(['userId', 'feedUrl'])

      t.foreign('userId')
        .references('userId')
        .inTable('users')
        .onUpdate('cascade')
        .onDelete('cascade')
    }),
    knex.schema.createTable('items', (t) => {
      t.increments('itemId').primary()
      t.integer('feedId').notNullable()
      t.string('title')
      t.string('link')
      t.string('content')
      t.string('contentSnippet')
      t.timestamp('pubDate').notNullable().defaultTo(knex.fn.now()).index()
      t.string('author')
      t.string('hash').notNullable()
      t.timestamps(false, true, true)

      t.unique(['feedId', 'hash'])

      t.foreign('feedid')
        .references('feedId')
        .inTable('feeds')
        .onUpdate('cascade')
        .onDelete('cascade')
    })
  ])
}

export function down(knex: Knex) {
  return Promise.all(
    ['users', 'feeds', 'items'].map((t) => knex.schema.dropTable(t))
  )
}
