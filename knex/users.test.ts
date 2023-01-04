import anyTest, { TestFn } from 'ava'

import knex, { Knex } from 'knex'

import config from '../knexfile'
import { encrypt, authenticate, getFeeds } from './users'

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

  await k('users').del()

  t.falsy(await authenticate(k, 'alice', 'password'))

  await k('users').insert([
    { username: 'alice', encryptedPassword: await encrypt('password') },
    { username: 'bob', encryptedPassword: await encrypt('pa55w0rd') }
  ])
  const user = await authenticate(k, 'alice', 'password')
  t.is(user?.username, 'alice')
})

test('getFeeds', async (t) => {
  const k = t.context.tx

  await k('users').del()
  await k('users').insert([
    {
      userId: 1,
      username: 'alice',
      encryptedPassword: await encrypt('password')
    },
    { userId: 2, username: 'bob', encryptedPassword: await encrypt('password') }
  ])
  await k('feeds').del()
  await k('feeds').insert([
    {
      userId: 1,
      title: 'a',
      link: 'https://a.com',
      feedUrl: 'https://a.com/rss'
    },
    {
      userId: 2,
      title: 'b',
      link: 'https://b.com',
      feedUrl: 'https://b.com/rss'
    }
  ])
  const feeds = await getFeeds(k, 1)
  t.true(feeds.length === 1)
  t.is(feeds[0].title, 'a')
})
