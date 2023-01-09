import anyTest, { TestFn } from 'ava'
import knex, { Knex } from 'knex'
import FakeTimers from '@sinonjs/fake-timers'
import config from '../knexfile'
import { createRepository } from './repository'
import { faker } from '@faker-js/faker'
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

function mockRSSFeed(url: string, { times = 1 } = {}) {
  return nock(url)
    .get('/.rss')
    .times(times)
    .reply(
      200,
      `
<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <atom:link rel="self" href="${url}/.rss" type="application/atom+xml" />
  <title>W3Schools Home Page</title>
  <link>https://www.w3schools.com</link>
  <description>Free web building tutorials</description>
  <item>
    <title>RSS Tutorial</title>
    <link>https://www.w3schools.com/xml/xml_rss.asp</link>
    <description>New RSS tutorial on W3Schools</description>
  </item>
  <item>
    <title>XML Tutorial</title>
    <link>https://www.w3schools.com/xml</link>
    <description>New XML tutorial on W3Schools</description>
  </item>
</channel>
</rss>
`
    )
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

test('createUser', async (t) => {
  const repo = createRepository(t.context.tx)

  const username = faker.internet.userName()
  const [{ userId }] = await repo.createUser(username, 'password')
  t.true(userId > 0)

  const user = await t.context.tx('users').where({ username }).first()
  t.is(user?.userId, userId)
})

test('createFeed', async (t) => {
  const url = faker.internet.url()
  const mocked = mockRSSFeed(url)

  const repo = createRepository(t.context.tx)
  const username = faker.internet.userName()

  const [{ userId }] = await repo.createUser(username, 'password')
  t.true(userId > 0)

  const userRepo = repo.createUserRepository(userId)

  const [{ feedId }] = await userRepo.createFeed({
    feedUrl: `${url}/.rss`
  })
  t.true(feedId > 0)

  mocked.done()
})

test('getFeed', async (t) => {
  const url = faker.internet.url()
  const mocked = mockRSSFeed(url)

  const repo = createRepository(t.context.tx)
  const username = faker.internet.userName()

  const [{ userId }] = await repo.createUser(username, 'password')
  t.true(userId > 0)

  const userRepo = repo.createUserRepository(userId)
  const [{ feedId }] = await userRepo.createFeed({
    feedUrl: `${url}/.rss`
  })

  const feed = await userRepo.getFeed(feedId)
  t.is(feed?.feedId, feedId)
  t.is(feed?.title, 'W3Schools Home Page')
  t.is(feed?.refreshedAt, t.context.clock.now)

  mocked.done()
})

test('getFeeds', async (t) => {
  const url = faker.internet.url()
  const mocked = mockRSSFeed(url)

  const repo = createRepository(t.context.tx)
  const username = faker.internet.userName()

  const [{ userId }] = await repo.createUser(username, 'password')
  t.true(userId > 0)

  const userRepo = repo.createUserRepository(userId)
  const [{ feedId }] = await userRepo.createFeed({
    feedUrl: `${url}/.rss`
  })

  const feeds = await userRepo.getFeeds()
  t.is(feeds[0]?.feedId, feedId)
  mocked.done()
})

test('refreshFeed', async (t) => {
  const url = faker.internet.url()
  const mocked = mockRSSFeed(url, { times: 2 })

  const repo = createRepository(t.context.tx)
  const username = faker.internet.userName()

  const [{ userId }] = await repo.createUser(username, 'password')
  t.true(userId > 0)

  const userRepo = repo.createUserRepository(userId)
  const [{ feedId }] = await userRepo.createFeed({
    feedUrl: `${url}/.rss`
  })

  const now = t.context.clock.now
  {
    const feed = await userRepo.getFeed(feedId)
    t.is(feed?.refreshedAt, now)
  }

  t.context.clock.tick(1)

  const res = await userRepo.refreshFeed(feedId)
  t.is(res && res[0], 2) // 2 items

  {
    const feed = await userRepo.getFeed(feedId)
    t.is(feed?.refreshedAt, now + 1)
  }

  mocked.done()
})
