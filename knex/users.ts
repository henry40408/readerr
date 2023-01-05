import { createHash, scrypt } from 'crypto'

import { Knex } from 'knex'
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
) {
  const user = await knex('users').where({ username }).first()
  if (!user) return null
  const matched = await check(user.encryptedPassword, password)
  if (!matched) return null
  return user
}

export async function createUser(
  knex: Knex,
  username: string,
  password: string
) {
  const encryptedPassword = await encrypt(password)
  return knex('users').insert({ username, encryptedPassword }, ['userId'])
}

export async function getFeeds(knex: Knex, userId: number) {
  return knex('feeds').select('feedId', 'title', 'link').where({ userId })
}

export type GetFeeds = Awaited<ReturnType<typeof getFeeds>>

export async function getFeed(knex: Knex, userId: number, feedId: number) {
  return knex('feeds')
    .select('feedId', 'title', 'link', 'feedUrl')
    .where({ userId, feedId })
    .first()
}

export type GetFeed = Awaited<ReturnType<typeof getFeed>>

export type NewFeed = {
  feedUrl: string
}

export async function createFeed(knex: Knex, userId: number, feed: NewFeed) {
  const [{ feedId }] = await knex('feeds').insert(
    {
      userId,
      feedUrl: feed.feedUrl,
      // TODO find subscription and fill the following columns automatically
      link: feed.feedUrl,
      title: feed.feedUrl
    },
    ['feedId']
  )
  refreshFeed(knex, userId, feedId).catch((err) => {
    console.error(`failed to refresh Feed#${feedId}`, err)
  })
  return [{ feedId }]
}

export type CreateFeed = Awaited<ReturnType<typeof createFeed>>

export async function destroyFeed(knex: Knex, userId: number, feedId: number) {
  return knex('feeds').where({ userId, feedId }).del()
}

export type DestroyFeed = Awaited<ReturnType<typeof destroyFeed>>

export async function refreshFeed(knex: Knex, userId: number, feedId: number) {
  const feed = await getFeed(knex, userId, feedId)
  if (!feed) return

  const parser = new Parser()
  const parsed = await parser.parseURL(feed.feedUrl)

  const values = []
  for (const item of parsed.items) {
    const { title, link, content, pubDate, author, id } = item
    if (!pubDate) continue
    if (!link && !id) continue

    const hasher = createHash('sha1')
    if (link) hasher.update(link)
    if (id) hasher.update(id)
    const hash = hasher.digest('hex')

    values.push({
      feedId,
      title,
      link,
      content,
      pubDate: new Date(pubDate),
      author,
      hash
    })
  }
  return knex('items').insert(values).onConflict(['feedId', 'hash']).ignore()
}
