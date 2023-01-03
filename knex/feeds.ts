import { Knex } from 'knex'

export async function getItems(knex: Knex, feedId: number) {
  return knex('items')
    .select(
      'itemId',
      'feedId',
      'title',
      'link',
      'content',
      'pubDate',
      'author',
      'guid'
    )
    .where({ feedId })
}
