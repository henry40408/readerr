import { createHash, scrypt } from 'crypto'
import { Knex } from 'knex'
import Parser from 'rss-parser'
import { dayjs } from '../helpers'
import fetch from 'node-fetch'

const secret = process.env.SECRET_KEY || 'secret'

export interface NewFeed {
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

export interface RefreshFeedOptions {
  content?: string
  updateSelf?: boolean
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

  async function createUserFeedRepository(userId: number, feedId: number) {
    const userRepo = createUserRepository(userId)
    const feed = await userRepo.getFeed(feedId)
    if (!feed) return null
    return createFeedRepository(feedId)
  }

  const createUserRepository = (userId: number) => {
    const feedParser = new Parser()

    async function createFeed(feed: NewFeed) {
      const content = await fetch(feed.feedUrl).then((r) => r.text())
      const parsed = await feedParser.parseString(content)
      const [{ feedId }] = await knex('feeds')
        .insert(
          {
            userId,
            link: parsed.link,
            feedUrl: parsed.feedUrl,
            title: parsed.title || ''
          },
          ['feedId']
        )
        .onConflict(['userId', 'feedUrl'])
        .merge()
      await refreshFeed(feedId, { content, updateSelf: true }).catch((err) => {
        console.error(`failed to refresh Feed#${feedId}`, err)
      })
      return [{ feedId }]
    }

    async function destroyFeed(feedId: number) {
      return knex('feeds').where({ userId, feedId }).del()
    }

    async function getFeed(feedId: number) {
      return knex('feeds')
        .select('feedId', 'title', 'link', 'feedUrl', 'refreshedAt')
        .where({ userId, feedId })
        .first()
    }

    async function getFeeds() {
      return knex('feeds')
        .select('feedId', 'title', 'link', 'refreshedAt')
        .where({ userId })
    }

    async function markAsRead(itemIds: number[]) {
      const now = Date.now()
      return knex('items')
        .whereIn('feedId', knex('feeds').select('feedId').where({ userId }))
        .whereIn('itemId', itemIds)
        .update({ readAt: now })
    }

    async function refreshFeed(feedId: number, options?: RefreshFeedOptions) {
      const now = Date.now()

      const feed = await getFeed(feedId)
      if (!feed) return

      const parsed = options?.content
        ? await feedParser.parseString(options.content)
        : await feedParser.parseURL(feed.feedUrl)
      if (options && options.updateSelf) {
        const { title } = parsed
        await knex('feeds')
          .where({ feedId })
          .update({ title, updatedAt: now })
          .catch((err) => {
            console.error(`failed to update Feed#${feedId}`, err)
          })
      }

      return knex.transaction(async (tx) => {
        const values = []
        for (const item of parsed.items) {
          const { title, link, content, contentSnippet, pubDate, author, id } =
            item
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
            contentSnippet,
            author,
            pubDate: (pubDate && dayjs(pubDate).valueOf()) || now,
            hash,
            createdAt: now,
            updatedAt: now
          })
        }

        const res = await tx('items')
          .insert(values)
          .onConflict(['feedId', 'hash'])
          .ignore()

        await tx('feeds')
          .where({ feedId })
          .update({ refreshedAt: now })
          .catch((err) => {
            console.error(`failed to refresh Feed#${feedId}`, err)
          })

        return res
      })
    }

    return {
      userId,
      createFeed,
      destroyFeed,
      getFeed,
      getFeeds,
      markAsRead,
      refreshFeed
    }
  }

  function createFeedRepository(feedId: number) {
    async function countUnread() {
      const [{ count }] = await knex('items')
        .where({ feedId })
        .whereNull('readAt')
        .count('itemId', { as: 'count' })
      return Number(count)
    }

    async function getItems() {
      return knex('items').where({ feedId }).orderBy('pubDate', 'desc')
    }

    return { feedId, countUnread, getItems }
  }

  return {
    authenticate,
    createFeedRepository,
    createUser,
    createUserFeedRepository,
    createUserRepository
  }
}
