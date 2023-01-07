import anyTest, { TestFn } from 'ava'
import knex, { Knex } from 'knex'
import FakeTimers from '@sinonjs/fake-timers'
import config from '../knexfile'
import { createRepository } from './repository'
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

test.beforeEach(
  (t) =>
    new Promise((resolve) => {
      nock('https://a.invalid')
        .get('/.rss')
        .times(2)
        .reply(
          200,
          `
<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <atom:link rel="self" href="https://a.invalid/.rss" type="application/atom+xml" />
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
      t.context.knex.transaction((tx) => {
        t.context.tx = tx
        resolve()
      })
    })
)

test.afterEach.always((t) => {
  nock.cleanAll()
  return t.context.tx.rollback()
})

test('authenticate', async (t) => {
  const repo = createRepository(t.context.tx)

  const u1 = await repo.authenticate('alice', 'password')
  t.falsy(u1)

  await repo.createUser('alice', 'password')

  const u2 = await repo.authenticate('alice', 'password')
  t.is(u2?.username, 'alice')

  const u3 = await repo.authenticate('alice', 'p')
  t.falsy(u3)
})

test('createUser', async (t) => {
  const repo = createRepository(t.context.tx)

  const [{ userId }] = await repo.createUser('alice', 'password')
  t.true(userId > 0)

  const user = await t.context.tx('users').where({ username: 'alice' }).first()
  t.is(user?.userId, userId)
})

test.serial('createFeed', async (t) => {
  const repo = createRepository(t.context.tx)

  const [{ userId }] = await repo.createUser('alice', 'password')
  t.true(userId > 0)

  const userRepo = repo.createUserRepository(userId)

  const [{ feedId }] = await userRepo.createFeed({
    feedUrl: 'https://a.invalid/.rss'
  })
  t.true(feedId > 0)
})

test.serial('getFeed', async (t) => {
  const repo = createRepository(t.context.tx)

  const [{ userId }] = await repo.createUser('alice', 'password')
  t.true(userId > 0)

  const userRepo = repo.createUserRepository(userId)
  const [{ feedId }] = await userRepo.createFeed({
    feedUrl: 'https://a.invalid/.rss'
  })

  const feed = await userRepo.getFeed(feedId)
  t.is(feed?.feedId, feedId)
  t.is(feed?.title, 'W3Schools Home Page')
  t.is(feed?.refreshedAt, t.context.clock.now)
})

test.serial('getFeeds', async (t) => {
  const repo = createRepository(t.context.tx)

  const [{ userId }] = await repo.createUser('alice', 'password')
  t.true(userId > 0)

  const userRepo = repo.createUserRepository(userId)
  const [{ feedId }] = await userRepo.createFeed({
    feedUrl: 'https://a.invalid/.rss'
  })

  const feeds = await userRepo.getFeeds()
  t.is(feeds[0]?.feedId, feedId)
})

test.serial('refreshFeed', async (t) => {
  const repo = createRepository(t.context.tx)

  const [{ userId }] = await repo.createUser('alice', 'password')
  t.true(userId > 0)

  const userRepo = repo.createUserRepository(userId)
  const [{ feedId }] = await userRepo.createFeed({
    feedUrl: 'https://a.invalid/.rss'
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
})
