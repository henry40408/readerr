import config from '../knexfile'
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

test('foreign keys is enabled', async (t) => {
  const k = t.context.tx
  const res = await k.raw('PRAGMA foreign_keys')
  t.is(res[0]['foreign_keys'], 1)
})
