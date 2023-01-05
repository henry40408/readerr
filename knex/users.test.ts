import config from '../knexfile'
import {
  authenticate,
  createUser,
  destroyFeed,
  encrypt,
  getFeeds
} from './users'
import anyTest, { TestFn } from 'ava'
import knex, { Knex } from 'knex'

const test = anyTest as TestFn<{ knex: Knex; tx: Knex.Transaction }>

test.before(async (t) => {
  const k = knex(config.test)
  t.context.knex = k
  await k.migrate.latest()
})

test.beforeEach(async (t) => {
  await new Promise((resolve) =>
    t.context.knex.transaction((tx) => {
      t.context.tx = tx
      resolve(null)
    })
  )
})

test.afterEach(async (t) => {
  await t.context.tx.rollback()
})

test('authenticate', async (t) => {
  const k = t.context.tx

  t.falsy(await authenticate(k, 'alice', 'password'))

  await k('users').insert({
    username: 'alice',
    encryptedPassword: await encrypt('password')
  })

  const user = await authenticate(k, 'alice', 'password')
  t.is(user?.username, 'alice')
})

test('createUser', async (t) => {
  const k = t.context.tx
  const [{ userId }] = await createUser(k, 'alice', 'password')
  t.true(userId > 0)
})

test('getFeeds', async (t) => {
  const k = t.context.tx

  const [{ userId }] = await createUser(k, 'alice', 'password')
  if (!userId) return t.fail()

  await k('feeds').insert({
    userId: userId,
    title: 'a',
    link: 'https://a.com',
    feedUrl: 'https://a.com/rss'
  })

  const feeds = await getFeeds(k, userId)
  t.true(feeds.length === 1)
  t.is(feeds[0].title, 'a')
})

test('destroyFeed', async (t) => {
  const k = t.context.tx

  const [{ userId }] = await createUser(k, 'alice', 'password')
  if (!userId) return t.fail()

  await k('feeds').insert({
    feedId: 1,
    userId,
    title: 'a',
    link: 'https://a.com',
    feedUrl: 'https://a.com/rss'
  })

  await k('items').insert({
    feedId: 1,
    hash: 'a'
  })

  {
    const res = await k('items').count('feedId', { as: 'count' })
    t.is(res[0].count, 1)
  }

  await destroyFeed(k, userId, 1)

  {
    const res = await k('items').count('feedId', { as: 'count' })
    t.is(res[0].count, 0)
  }
})
