const { encrypt } = require('../knex/users')
const Parser = require('rss-parser')

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async (knex) => {
  await knex('users').del()
  const [userId] = await knex('users').insert([
    { username: 'user', encryptedPassword: await encrypt('password') }
  ])

  const parser = new Parser()
  const parsed = await parser.parseURL('https://www.reddit.com/.rss')

  await knex('feeds').del()
  const { link, title } = parsed
  const [feedId] = await knex('feeds').insert([
    {
      userId,
      link,
      title
    }
  ])

  await knex('items').del()
  const values = []
  for (const item of parsed.items) {
    const { title, link, content, pubDate, author, id } = item
    values.push({
      feedId,
      title,
      link,
      content,
      pubDate,
      author,
      guid: id
    })
  }
  await knex('items').insert(values)
}
