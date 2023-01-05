import { encrypt, refreshFeed } from '../knex/users'
import { Knex } from 'knex'
import Parser from 'rss-parser'

export async function seed(knex: Knex) {
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
      feedUrl: 'https://www.reddit.com/.rss',
      link,
      title
    }
  ])

  await knex('items').del()
  await refreshFeed(knex, userId, feedId)
}
