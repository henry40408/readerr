/**
 * @param {import('knex').Knex} knex
 * @param {number} feedId
 */
exports.getItems = async (knex, feedId) => {
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
