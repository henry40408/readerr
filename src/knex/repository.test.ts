import anyTest, { TestFn } from 'ava'
import knex, { Knex } from 'knex'
import FakeTimers from '@sinonjs/fake-timers'
import config from '../../knexfile'
import { createRepository } from './repository'
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
  const repo = createRepository(t.context.tx)

  const username = faker.internet.userName()
  const u1 = await repo.authenticate(username, 'password')
  t.falsy(u1)

  await repo.createUser(username, 'password')

  const u2 = await repo.authenticate(username, 'password')
  t.is(u2?.username, username)

  const u3 = await repo.authenticate(username, 'p')
  t.falsy(u3)
})

test('create user', async (t) => {
  const repo = createRepository(t.context.tx)

  const username = faker.internet.userName()
  const [{ userId }] = await repo.createUser(username, 'password')
  t.true(userId > 0)

  const user = await t.context.tx('users').where({ username }).first()
  t.is(user?.userId, userId)
})

test('create atom feed', async (t) => {
  const mocked = await mockAtomFeed()

  const repo = createRepository(t.context.tx)
  const username = faker.internet.userName()

  const [{ userId }] = await repo.createUser(username, 'password')
  t.true(userId > 0)

  const userRepo = repo.createUserRepository(userId)

  const [{ feedId }] = await userRepo.createFeed({
    feedUrl: 'https://github.com/miniflux/v2/releases.atom'
  })
  t.true(feedId > 0)

  const unreadItems = await userRepo.unreadItems()
  t.is(unreadItems.length, 10)

  mocked.done()
})

test('create rss feed', async (t) => {
  const mocked = await mockRSSFeed()

  const repo = createRepository(t.context.tx)
  const username = faker.internet.userName()

  const [{ userId }] = await repo.createUser(username, 'password')
  t.true(userId > 0)

  const userRepo = repo.createUserRepository(userId)

  const [{ feedId }] = await userRepo.createFeed({
    feedUrl: 'http://www.nasa.gov/rss/dyn/breaking_news.rss'
  })
  t.true(feedId > 0)

  const unreadItems = await userRepo.unreadItems()
  t.is(unreadItems.length, 10)

  mocked.done()
})

test('get feed', async (t) => {
  const mocked = await mockRSSFeed()

  const repo = createRepository(t.context.tx)
  const username = faker.internet.userName()

  const [{ userId }] = await repo.createUser(username, 'password')
  t.true(userId > 0)

  const userRepo = repo.createUserRepository(userId)
  const [{ feedId }] = await userRepo.createFeed({
    feedUrl: 'http://www.nasa.gov/rss/dyn/breaking_news.rss'
  })

  const feed = await userRepo.getFeed(feedId)
  t.is(feed?.feedId, feedId)
  t.is(feed?.title, 'NASA Breaking News')
  t.is(feed?.refreshedAt, t.context.clock.now)

  mocked.done()
})

test('get feeds', async (t) => {
  const mocked = await mockRSSFeed()

  const repo = createRepository(t.context.tx)
  const username = faker.internet.userName()

  const [{ userId }] = await repo.createUser(username, 'password')
  t.true(userId > 0)

  const userRepo = repo.createUserRepository(userId)
  const [{ feedId }] = await userRepo.createFeed({
    feedUrl: 'http://www.nasa.gov/rss/dyn/breaking_news.rss'
  })

  const feeds = await userRepo.getFeeds()
  t.is(feeds[0]?.feedId, feedId)
  mocked.done()
})

test('refresh atom feed', async (t) => {
  const mocked = await mockAtomFeed({ times: 2 })

  const repo = createRepository(t.context.tx)
  const username = faker.internet.userName()

  const [{ userId }] = await repo.createUser(username, 'password')
  t.true(userId > 0)

  const userRepo = repo.createUserRepository(userId)
  const [{ feedId }] = await userRepo.createFeed({
    feedUrl: 'https://github.com/miniflux/v2/releases.atom'
  })

  const now = t.context.clock.now
  {
    const feed = await userRepo.getFeed(feedId)
    t.is(feed?.refreshedAt, now)
  }

  t.context.clock.tick(1)

  const res = await userRepo.refreshFeed(feedId)
  t.is(res && res[0], 10) // 10 items

  {
    const feed = await userRepo.getFeed(feedId)
    t.is(feed?.refreshedAt, now + 1)
  }

  const item = await t.context.tx('items').first()
  t.truthy(item?.title)
  t.truthy(item?.content)
  t.truthy(item?.contentSnippet)

  mocked.done()
})

test('refresh rss feed', async (t) => {
  const mocked = await mockRSSFeed({ times: 2 })

  const repo = createRepository(t.context.tx)
  const username = faker.internet.userName()

  const [{ userId }] = await repo.createUser(username, 'password')
  t.true(userId > 0)

  const userRepo = repo.createUserRepository(userId)
  const [{ feedId }] = await userRepo.createFeed({
    feedUrl: 'http://www.nasa.gov/rss/dyn/breaking_news.rss'
  })

  const now = t.context.clock.now
  {
    const feed = await userRepo.getFeed(feedId)
    t.is(feed?.refreshedAt, now)
  }

  t.context.clock.tick(1)

  const res = await userRepo.refreshFeed(feedId)
  t.is(res && res[0], 10) // 10 items

  {
    const feed = await userRepo.getFeed(feedId)
    t.is(feed?.refreshedAt, now + 1)
  }

  const item = await t.context.tx('items').first()
  t.truthy(item?.title)
  t.truthy(item?.content)
  t.truthy(item?.contentSnippet)

  mocked.done()
})

test('mark single item as read / unread', async (t) => {
  const mocked = await mockRSSFeed()
  const repo = createRepository(t.context.tx)

  const username = faker.internet.userName()
  const [{ userId }] = await repo.createUser(username, 'password')
  const userRepo = repo.createUserRepository(userId)

  const [{ feedId }] = await userRepo.createFeed({
    feedUrl: 'http://www.nasa.gov/rss/dyn/breaking_news.rss'
  })

  const [{ itemId, readAt }] = await t.context.tx('items').where({ feedId })
  t.falsy(readAt)

  const affected = await userRepo.markAsRead([itemId])
  t.is(affected, 1)

  const item = await t.context.tx('items').where({ itemId }).first()
  t.is(item?.readAt, t.context.clock.now)

  {
    const affected = await userRepo.markAsUnread([itemId])
    t.is(affected, 1)
  }

  {
    const item = await t.context.tx('items').where({ itemId }).first()
    t.falsy(item?.readAt)
  }

  mocked.done()
})

test('mark plural items as read / unread', async (t) => {
  const mocked = await mockRSSFeed()
  const repo = createRepository(t.context.tx)

  const username = faker.internet.userName()
  const [{ userId }] = await repo.createUser(username, 'password')
  const userRepo = repo.createUserRepository(userId)

  const [{ feedId }] = await userRepo.createFeed({
    feedUrl: 'http://www.nasa.gov/rss/dyn/breaking_news.rss'
  })

  const [item1, item2] = await t.context.tx('items').where({ feedId })
  t.falsy(item1.readAt)
  t.falsy(item2.readAt)

  const affected = await userRepo.markAsRead([item1.itemId, item2.itemId])
  t.is(affected, 2)

  const [item3, item4] = await t.context
    .tx('items')
    .whereIn('itemId', [item1.itemId, item2.itemId])
  t.is(item3.readAt, t.context.clock.now)
  t.is(item4.readAt, t.context.clock.now)

  {
    const affected = await userRepo.markAsUnread([item1.itemId, item2.itemId])
    t.is(affected, 2)
  }

  const [item5, item6] = await t.context
    .tx('items')
    .whereIn('itemId', [item1.itemId, item2.itemId])
  t.falsy(item5.readAt)
  t.falsy(item6.readAt)

  mocked.done()
})

test('count unread', async (t) => {
  const mocked = await mockRSSFeed()
  const repo = createRepository(t.context.tx)

  const username = faker.internet.userName()
  const [{ userId }] = await repo.createUser(username, 'password')
  const userRepo = repo.createUserRepository(userId)

  const [{ feedId }] = await userRepo.createFeed({
    feedUrl: 'http://www.nasa.gov/rss/dyn/breaking_news.rss'
  })
  const unreads = await userRepo.countUnread([feedId])
  console.debug('unreads', unreads)
  // t.is(unreads[0], 10)

  const feedRepo = repo.createFeedRepository(feedId)
  const unread = await feedRepo.countUnread()
  t.is(unread, 10)

  mocked.done()
})
