import { scrypt } from 'crypto'

import { Knex } from 'knex'
import { User } from 'knex/types/tables'
import Parser from 'rss-parser'

const secret = process.env.SECRET_KEY || 'secret'

export function encrypt(password: string): Promise<string> {
  return new Promise((resolve, reject) =>
    scrypt(password, secret, 64, (err, encrypted) =>
      err ? reject(err) : resolve(encrypted.toString('hex'))
    )
  )
}

export async function check(hashed: string, password: string) {
  const actual = await encrypt(password)
  return actual === hashed
}

export async function authenticate(
  knex: Knex,
  username: string,
  password: string
): Promise<User | null> {
  const user = await knex('users').where({ username }).first()
  if (!user) return null
  const matched = await check(user.encryptedPassword, password)
  if (!matched) return null
  return user
}

export async function getFeeds(knex: Knex, userId: number) {
  return knex('feeds').select('feedId', 'title', 'link').where({ userId })
}

export async function getFeed(knex: Knex, userId: number, feedId: number) {
  return knex('feeds')
    .select('feedId', 'title', 'link', 'feedUrl')
    .where({ userId, feedId })
    .first()
}

export async function refreshFeed(knex: Knex, userId: number, feedId: number) {
  const feed = await getFeed(knex, userId, feedId)
  if (!feed) return

  const parser = new Parser()
  const parsed = await parser.parseURL(feed.feedUrl)

  const values = []
  for (const item of parsed.items) {
    const { title, link, content, pubDate, author, id } = item
    if (!pubDate) continue
    values.push({
      feedId,
      title,
      link,
      content,
      pubDate: new Date(pubDate),
      author,
      guid: id
    })
  }
  return knex('items').insert(values).onConflict(['feedId', 'guid']).ignore()
}
