import { createHash, scrypt } from 'crypto'
import { Knex } from 'knex'
import Parser from 'rss-parser'
import fetch from 'node-fetch'

const secret = process.env.SECRET_KEY || 'secret'

export type NewFeed = {
  feedUrl: string
}

export async function encrypt(password: string): Promise<string> {
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

export function createRepository(knex: Knex) {
  async function authenticate(username: string, password: string) {
    const user = await knex('users').where({ username }).first()
    if (!user) return null

    const matched = await check(user.encryptedPassword, password)
    if (!matched) return null

    return user
  }

  async function createUser(username: string, password: string) {
    const encryptedPassword = await encrypt(password)
    return knex('users').insert({ username, encryptedPassword }, ['userId'])
  }

  const createUserRepository = (userId: number) => {
    async function createFeed(feed: NewFeed) {
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
      await refreshFeed(feedId).catch((err) => {
        console.error(`failed to refresh Feed#${feedId}`, err)
      })
      return [{ feedId }]
    }

    async function destroyFeed(feedId: number) {
      return knex('feeds').where({ userId, feedId }).del()
    }

    async function getFeeds() {
      return knex('feeds').select('feedId', 'title', 'link').where({ userId })
    }

    async function getFeed(feedId: number) {
      return knex('feeds')
        .select('feedId', 'title', 'link', 'feedUrl')
        .where({ userId, feedId })
        .first()
    }

    async function refreshFeed(feedId: number) {
      const feed = await getFeed(feedId)
      if (!feed) return

      const parser = new Parser()
      const content = await fetch(feed.feedUrl).then((r) => r.text())
      const parsed = await parser.parseString(content)

      const values = []
      for (const item of parsed.items) {
        const { title, link, content, pubDate, author, id } = item
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
          author,
          pubDate: (pubDate && new Date(pubDate).valueOf()) || undefined,
          hash
        })
      }
      return knex('items')
        .insert(values)
        .onConflict(['feedId', 'hash'])
        .ignore()
    }

    return { createFeed, destroyFeed, getFeed, getFeeds, refreshFeed, userId }
  }

  function createFeedRepository(feedId: number) {
    async function getItems() {
      return knex('items').where({ feedId })
    }
    return { feedId, getItems }
  }

  return {
    authenticate,
    createUser,
    createFeedRepository,
    createUserRepository
  }
}
