const test = require('ava')

const knex = require('knex')

const config = require('../knexfile')
const { encrypt, authenticate } = require('./users')

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
