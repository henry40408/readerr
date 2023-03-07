import {
  CountItemsFilter,
  ListItemsFilter,
  RefreshFeedSource,
  Repository,
  UpdateItemsUpdate
} from './repository'
import anyTest, { TestFn } from 'ava'
import knex, { Knex } from 'knex'
import FakeTimers from '@sinonjs/fake-timers'
import config from '../../knexfile'
import { faker } from '@faker-js/faker'
import { promises as fs } from 'fs'
import nock from 'nock'

const test = anyTest as TestFn<{
  clock: FakeTimers.InstalledClock
  knex: Knex
  tx: Knex.Transaction
}>

test.before(async (t) => {
  nock.disableNetConnect()
  t.context.clock = FakeTimers.install({
    now: new Date(2023, 0, 1, 0, 0, 0, 0)
  })
  const k = knex(config.test)
  t.context.knex = k
  await k.migrate.latest()
})

test.after.always((t) => {
  t.context.clock.uninstall()
})

async function mockAtomFeed({ times = 1 } = {}) {
  return nock('https://github.com')
    .get('/miniflux/v2/releases.atom')
    .times(times)
    .reply(200, await fs.readFile('./fixtures/miniflux.atom'))
}

async function mockRSSFeed({ times = 1 } = {}) {
  return nock('http://www.nasa.gov')
    .get('/rss/dyn/breaking_news.rss')
    .times(times)
    .reply(200, await fs.readFile('./fixtures/nasa.rss'))
}

test.beforeEach(
  (t) =>
    new Promise((resolve) => {
      t.context.knex.transaction((tx) => {
        t.context.tx = tx
        resolve()
      })
    })
)

test.afterEach.always((t) => {
  return t.context.tx.rollback()
})

test('authenticate', async (t) => {
  const repo = new Repository(t.context.tx)

  const username = faker.internet.userName()
  const { user: u1 } = await repo.authenticate({
    username,
    password: 'password'
  })
  t.falsy(u1)

  await repo.createUser({ username, password: 'password' })

  const { user: u2 } = await repo.authenticate({
    username,
    password: 'password'
  })
  t.is(u2?.username, username)

  const { user: u3 } = await repo.authenticate({ username, password: 'p' })
  t.falsy(u3)
})

test('createUser', async (t) => {
  const repo = new Repository(t.context.tx)

  const username = faker.internet.userName()
  const { userId } = await repo.createUser({ username, password: 'password' })
  t.true(userId > 0)

  const user = await t.context.tx('users').where({ username }).first()
  t.is(user?.userId, userId)
})

test('createFeed: atom', async (t) => {
  const mocked = await mockAtomFeed()

  const repo = new Repository(t.context.tx)
  const username = faker.internet.userName()

  const { userId } = await repo.createUser({ username, password: 'password' })
  t.true(userId > 0)

  const { feedId } = await repo.createFeed({
    feedUrl: 'https://github.com/miniflux/v2/releases.atom',
    userId
  })
  t.true(feedId > 0)

  const filter: ListItemsFilter = { kind: 'unread', scope: { kind: 'user' } }
  const { items } = await repo.listItems({ filter, userId })
  t.is(items.length, 10)

  mocked.done()
})

test('createFeed: rss', async (t) => {
  const mocked = await mockRSSFeed()

  const repo = new Repository(t.context.tx)
  const username = faker.internet.userName()

  const { userId } = await repo.createUser({ username, password: 'password' })
  t.true(userId > 0)

  const { feedId } = await repo.createFeed({
    feedUrl: 'http://www.nasa.gov/rss/dyn/breaking_news.rss',
    userId
  })
  t.true(feedId > 0)

  const filter: ListItemsFilter = { kind: 'unread', scope: { kind: 'user' } }
  const { items } = await repo.listItems({ filter, userId })
  t.is(items.length, 10)

  mocked.done()
})

test('listFeeds: single', async (t) => {
  const mocked = await mockRSSFeed()

  const repo = new Repository(t.context.tx)
  const username = faker.internet.userName()

  const { userId } = await repo.createUser({ username, password: 'password' })
  t.true(userId > 0)

  const { feedId } = await repo.createFeed({
    feedUrl: 'http://www.nasa.gov/rss/dyn/breaking_news.rss',
    userId
  })

  const { feeds } = await repo.listFeeds({ feedIds: [feedId], userId })
  t.is(feeds[0]?.feedId, feedId)
  t.is(feeds[0]?.title, 'NASA Breaking News')
  t.is(feeds[0]?.refreshedAt, t.context.clock.now)

  mocked.done()
})

test('listFeeds: plural', async (t) => {
  const mocked = await mockRSSFeed()

  const repo = new Repository(t.context.tx)
  const username = faker.internet.userName()

  const { userId } = await repo.createUser({ username, password: 'password' })
  t.true(userId > 0)

  const { feedId } = await repo.createFeed({
    feedUrl: 'http://www.nasa.gov/rss/dyn/breaking_news.rss',
    userId
  })

  const { feeds } = await repo.listFeeds({ userId })
  t.is(feeds[0]?.feedId, feedId)
  mocked.done()
})

test('refreshFeed: atom', async (t) => {
  const mocked = await mockAtomFeed({ times: 2 })

  const repo = new Repository(t.context.tx)

  const username = faker.internet.userName()
  const { userId } = await repo.createUser({ username, password: 'password' })
  t.true(userId > 0)

  const feedUrl = 'https://github.com/miniflux/v2/releases.atom'
  const { feedId } = await repo.createFeed({
    feedUrl,
    userId
  })

  const now = t.context.clock.now
  {
    const { feeds } = await repo.listFeeds({ feedIds: [feedId], userId })
    t.is(feeds[0]?.refreshedAt, now)
  }

  t.context.clock.tick(1)

  const source: RefreshFeedSource = { kind: 'url', feedUrl }
  const { inserted } = await repo.refreshFeed({ feedId, source, userId })
  t.is(inserted[0], 10) // 10 items

  {
    const { feeds } = await repo.listFeeds({ feedIds: [feedId], userId })
    t.is(feeds[0]?.refreshedAt, now + 1)
  }

  const item = await t.context.tx('items').first()
  t.truthy(item?.title)
  t.truthy(item?.content)
  t.truthy(item?.contentSnippet)

  mocked.done()
})

test('refreshFeed', async (t) => {
  const mocked = await mockRSSFeed({ times: 2 })

  const repo = new Repository(t.context.tx)
  const username = faker.internet.userName()

  const { userId } = await repo.createUser({ username, password: 'password' })
  t.true(userId > 0)

  const feedUrl = 'http://www.nasa.gov/rss/dyn/breaking_news.rss'
  const { feedId } = await repo.createFeed({
    feedUrl,
    userId
  })

  const now = t.context.clock.now
  {
    const { feeds } = await repo.listFeeds({ feedIds: [feedId], userId })
    t.is(feeds[0]?.refreshedAt, now)
  }

  t.context.clock.tick(1)

  const source: RefreshFeedSource = { kind: 'url', feedUrl }
  const { inserted } = await repo.refreshFeed({ feedId, source, userId })
  t.is(inserted[0], 10) // 10 items

  {
    const { feeds } = await repo.listFeeds({ feedIds: [feedId], userId })
    t.is(feeds[0]?.refreshedAt, now + 1)
  }

  const item = await t.context.tx('items').first()
  t.truthy(item?.title)
  t.truthy(item?.content)
  t.truthy(item?.contentSnippet)

  mocked.done()
})

test('updateItems: mark single item as read / unread', async (t) => {
  const mocked = await mockRSSFeed()
  const repo = new Repository(t.context.tx)

  const username = faker.internet.userName()
  const { userId } = await repo.createUser({ username, password: 'password' })

  const { feedId } = await repo.createFeed({
    feedUrl: 'http://www.nasa.gov/rss/dyn/breaking_news.rss',
    userId
  })

  const [{ itemId, readAt }] = await t.context.tx('items').where({ feedId })
  t.falsy(readAt)

  const update: UpdateItemsUpdate = {
    kind: 'markAsRead',
    timestamp: Date.now()
  }
  const { affected } = await repo.updateItems({
    itemIds: [itemId],
    update,
    userId
  })
  t.is(affected, 1)

  const item = await t.context.tx('items').where({ itemId }).first()
  t.is(item?.readAt, t.context.clock.now)

  {
    const update: UpdateItemsUpdate = { kind: 'markAsUnread' }
    const { affected } = await repo.updateItems({
      itemIds: [itemId],
      update,
      userId
    })
    t.is(affected, 1)
  }

  {
    const item = await t.context.tx('items').where({ itemId }).first()
    t.falsy(item?.readAt)
  }

  mocked.done()
})

test('updateItems: mark plural items as read / unread', async (t) => {
  const mocked = await mockRSSFeed()
  const repo = new Repository(t.context.tx)

  const username = faker.internet.userName()
  const { userId } = await repo.createUser({ username, password: 'password' })

  const { feedId } = await repo.createFeed({
    feedUrl: 'http://www.nasa.gov/rss/dyn/breaking_news.rss',
    userId
  })

  const [item1, item2] = await t.context.tx('items').where({ feedId })
  t.falsy(item1.readAt)
  t.falsy(item2.readAt)

  const itemIds = [item1.itemId, item2.itemId]
  const update: UpdateItemsUpdate = {
    kind: 'markAsRead',
    timestamp: Date.now()
  }
  const { affected } = await repo.updateItems({ itemIds, update, userId })
  t.is(affected, 2)

  const [item3, item4] = await t.context
    .tx('items')
    .whereIn('itemId', [item1.itemId, item2.itemId])
  t.is(item3.readAt, t.context.clock.now)
  t.is(item4.readAt, t.context.clock.now)

  {
    const update: UpdateItemsUpdate = { kind: 'markAsUnread' }
    const { affected } = await repo.updateItems({ itemIds, update, userId })
    t.is(affected, 2)
  }

  const [item5, item6] = await t.context
    .tx('items')
    .whereIn('itemId', [item1.itemId, item2.itemId])
  t.falsy(item5.readAt)
  t.falsy(item6.readAt)

  mocked.done()
})

test('countItems', async (t) => {
  const mocked = await mockRSSFeed()

  const repo = new Repository(t.context.tx)

  const username = faker.internet.userName()
  const { userId } = await repo.createUser({ username, password: 'password' })

  const { feedId } = await repo.createFeed({
    feedUrl: 'http://www.nasa.gov/rss/dyn/breaking_news.rss',
    userId
  })

  const filter: CountItemsFilter = { kind: 'feed', feedIds: [feedId] }
  const { count } = await repo.countItems({ filter, userId })
  t.is(count, 10)

  {
    const filter: CountItemsFilter = { kind: 'user' }
    const { count } = await repo.countItems({ filter, userId })
    t.is(count, 10)
  }

  mocked.done()
})
