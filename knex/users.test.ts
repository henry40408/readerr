import anyTest, { TestFn } from 'ava'

import knex, { Knex } from 'knex'

import config from '../knexfile'
import { encrypt, authenticate } from './users'

const test = anyTest as TestFn<{ knex: Knex }>

test.before(async (t) => {
  const k = knex(config.test)
  t.context.knex = k
  await k.migrate.latest()
})

test('authenticate', async (t) => {
  const k = t.context.knex
  await k('users').where({ username: 'user' }).del()

  t.falsy(await authenticate(k, 'user', 'password'))

  await k('users').insert([
    { username: 'user', encryptedPassword: await encrypt('password') }
  ])
  const user = await authenticate(k, 'user', 'password')
  t.is(user.username, 'user')
})
