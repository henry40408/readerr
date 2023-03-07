import { Feed, Item, User } from 'knex/types/tables'
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

export type GetFeeds =
  | { kind: 'all'; ids?: never }
  | { kind: 'many'; feedIds: number[] }

export interface RefreshFeedOptions {
  content?: string
  updateSelf?: boolean
}

export function newRepo(knex: Knex) {
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

  async function newUserFeedRepo(userId: number, feedId: number) {
    const userRepo = newUserRepo(userId)
    const feed = await userRepo.getFeed(feedId)
    if (!feed) return null
    return newFeedRepo(feedId)
  }

  const newUserRepo = (userId: number) => {
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

    async function feedsUnread(feedIds: number[]) {
      return knex('items')
        .select('feedId')
        .whereIn(
          'feedId',
          knex('feeds')
            .select('feedId')
            .where({ userId })
            .whereIn('feedId', feedIds)
        )
        .whereNull('readAt')
        .count('itemId', { as: 'count' })
        .groupBy('feedId')
    }

    async function getFeed(feedId: number) {
      return knex('feeds')
        .select('feedId', 'title', 'link', 'feedUrl', 'refreshedAt')
        .where({ userId, feedId })
        .first()
    }

    async function getFeeds(criteria?: GetFeeds) {
      if (criteria?.kind === 'many') {
        return knex('feeds')
          .select('feedId', 'title', 'link', 'refreshedAt')
          .where({ userId })
          .whereIn('feedId', criteria.feedIds)
      }
      return knex('feeds')
        .select('feedId', 'title', 'link', 'refreshedAt')
        .where({ userId })
    }

    async function markAsRead(itemIds: number[]) {
      const now = Date.now()
      return knex('items')
        .whereIn('feedId', knex('feeds').select('feedId').where({ userId }))
        .whereIn('itemId', itemIds)
        .whereNull('readAt')
        .update({ readAt: now })
    }

    async function markAsUnread(itemIds: number[]) {
      return knex('items')
        .whereIn('feedId', knex('feeds').select('feedId').where({ userId }))
        .whereIn('itemId', itemIds)
        .whereNotNull('readAt')
        .update({ readAt: null })
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

    function unreadItemQuery() {
      return knex('items')
        .whereIn('feedId', knex('feeds').select('feedId').where({ userId }))
        .whereNull('readAt')
    }

    async function unreadItems() {
      return unreadItemQuery().orderBy('pubDate', 'desc')
    }

    async function unreadCount() {
      const [{ count }] = await unreadItemQuery().count('itemId', {
        as: 'count'
      })
      return Number(count)
    }

    return {
      userId,
      createFeed,
      destroyFeed,
      feedsUnread,
      getFeed,
      getFeeds,
      markAsRead,
      markAsUnread,
      refreshFeed,
      unreadCount,
      unreadItems
    }
  }

  function newFeedRepo(feedId: number) {
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
    newFeedRepo,
    createUser,
    newUserFeedRepo,
    newUserRepo
  }
}

export interface AuthenticateRequest {
  username: string
  password: string
}

export interface AuthenticateResponse {
  user: null | Partial<User>
}

export interface CreateFeedRequest {
  feedUrl: string
  userId: number
}

export interface CreateFeedResponse {
  feedId: number
}

export type CountItemsFilter =
  | {
      kind: 'feed'
      feedIds: number[]
    }
  | { kind: 'user' }

export interface CountItemsRequest {
  filter: CountItemsFilter
  userId: number
}

export interface CountItemsResponse {
  count: number
}

export interface CreateUserRequest {
  password: string
  username: string
}

export interface CreateUserResponse {
  userId: number
}

export interface ListFeedRequest {
  feedIds?: number[]
  userId: number
}

export type ListItemsScope =
  | { kind: 'feed'; feedIds: number[] }
  | { kind: 'user' }

export type ListItemsFilter = {
  kind: 'unread'
  scope: ListItemsScope
}

export interface ListItemsRequest {
  filter: ListItemsFilter
  userId: number
}

export interface ListFeedResponse {
  feeds: Pick<Feed, 'feedId' | 'title' | 'link' | 'refreshedAt'>[]
}

export interface ListItemsResponse {
  items: Partial<Item>[]
}

export type RefreshFeedSource =
  | { kind: 'content'; content: string }
  | { kind: 'url'; feedUrl: string }

export interface RefreshFeedRequest {
  feedId: number
  source: RefreshFeedSource
  updateSelf?: boolean
  userId: number
}

export interface RefreshFeedResponse {
  inserted: number[]
}

export type UpdateItemsUpdate =
  | {
      kind: 'markAsRead'
      timestamp: number
    }
  | { kind: 'markAsUnread' }

export interface UpdateItemsRequest {
  itemIds: number[]
  update: UpdateItemsUpdate
  userId: number
}

export interface UpdateItemsResponse {
  affected: number
}

export class Repository {
  private feedParser: Parser
  private knex: Knex

  constructor(knex: Knex) {
    this.feedParser = new Parser()
    this.knex = knex
  }

  // User

  async authenticate(
    params: AuthenticateRequest
  ): Promise<AuthenticateResponse> {
    const { username, password } = params

    const user = await this.knex('users').where({ username }).first()
    if (!user) return { user: null }

    const matched = await check(user.encryptedPassword, password)
    if (!matched) return { user: null }

    return { user }
  }

  async createUser(params: CreateUserRequest): Promise<CreateUserResponse> {
    const { username, password } = params
    const encryptedPassword = await encrypt(password)
    const [{ userId }] = await this.knex('users').insert(
      { username, encryptedPassword },
      ['userId']
    )
    return { userId }
  }

  // Feed

  async createFeed(params: CreateFeedRequest): Promise<CreateFeedResponse> {
    const { userId } = params
    const content = await fetch(params.feedUrl).then((r) => r.text())
    const parsed = await this.feedParser.parseString(content)
    const [{ feedId }] = await this.knex('feeds')
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
    const source: RefreshFeedSource = { kind: 'content', content }
    await this.refreshFeed({ feedId, source, updateSelf: true, userId }).catch(
      (err) => {
        console.error(`failed to refresh Feed#${feedId}`, err)
      }
    )
    return { feedId }
  }

  async listFeeds(params: ListFeedRequest): Promise<ListFeedResponse> {
    let q = this.knex('feeds')
      .select('feedId', 'title', 'link', 'refreshedAt')
      .where({ userId: params.userId })
    if (params.feedIds) {
      q = q.whereIn('feedId', params.feedIds)
    }
    return {
      feeds: await q
    }
  }

  async refreshFeed(params: RefreshFeedRequest): Promise<RefreshFeedResponse> {
    const { feedId, source, userId } = params

    const now = Date.now()

    const { feeds } = await this.listFeeds({ userId, feedIds: [feedId] })
    if (feeds.length !== 1) {
      throw new Error(`Feed#${feedId} does not exist`)
    }

    const parsed =
      source.kind === 'content'
        ? await this.feedParser.parseString(source.content)
        : await this.feedParser.parseURL(source.feedUrl)

    if (params.updateSelf) {
      const { title } = parsed
      await this.knex('feeds')
        .where({ feedId })
        .update({ title, updatedAt: now })
        .catch((err) => {
          console.error(`failed to update Feed#${feedId}`, err)
        })
    }

    return this.knex.transaction(async (tx) => {
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

      const inserted = await tx('items')
        .insert(values)
        .onConflict(['feedId', 'hash'])
        .ignore()

      await tx('feeds')
        .where({ feedId })
        .update({ refreshedAt: now })
        .catch((err) => {
          console.error(`failed to refresh Feed#${feedId}`, err)
        })

      return { inserted }
    })
  }

  // Item

  async countItems(params: CountItemsRequest): Promise<CountItemsResponse> {
    const { filter, userId } = params
    switch (filter.kind) {
      case 'feed': {
        const [{ count }] = await this.knex('items')
          .select('feedId')
          .whereIn(
            'feedId',
            this.knex('feeds')
              .select('feedId')
              .where({ userId })
              .whereIn('feedId', filter.feedIds)
          )
          .whereNull('readAt')
          .count('itemId', { as: 'count' })
          .groupBy('feedId')
        return { count: Number(count) }
      }
      case 'user': {
        const [{ count }] = await this.unreadItemsQuery({ userId }).count(
          'itemId',
          { as: 'count' }
        )
        return { count: Number(count) }
      }
    }
  }

  async listItems(params: ListItemsRequest): Promise<ListItemsResponse> {
    const { filter, userId } = params
    switch (filter.kind) {
      case 'unread': {
        switch (filter.scope.kind) {
          case 'feed': {
            const items = await this.unreadItemsQuery({ userId })
              .whereIn('feedId', filter.scope.feedIds)
              .orderBy('pubDate', 'desc')
            return { items }
          }
          case 'user': {
            const items = await this.unreadItemsQuery({ userId }).orderBy(
              'pubDate',
              'desc'
            )
            return { items }
          }
        }
      }
    }
  }

  async updateItems(params: UpdateItemsRequest): Promise<UpdateItemsResponse> {
    const { itemIds, update, userId } = params
    const q = this.knex('items')
      .whereIn('feedId', this.knex('feeds').select('feedId').where({ userId }))
      .whereIn('itemId', itemIds)
    switch (update.kind) {
      case 'markAsRead': {
        const now = Date.now()
        const affected = await q.whereNull('readAt').update({ readAt: now })
        return { affected }
      }
      case 'markAsUnread': {
        const affected = await q.whereNotNull('readAt').update({ readAt: null })
        return { affected }
      }
    }
  }

  private unreadItemsQuery({ userId }: { userId: number }) {
    return this.knex('items')
      .whereIn('feedId', this.knex('feeds').select('feedId').where({ userId }))
      .whereNull('readAt')
  }
}
