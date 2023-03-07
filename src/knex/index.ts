import knex, { Knex } from 'knex'
import config from '../../knexfile'

declare global {
  // eslint-disable-next-line no-var
  var cached: { knex?: Knex }
}

let cached = global.cached
if (!cached) cached = global.cached = {}

export function getKnex() {
  if (!cached.knex) cached.knex = knex(config[process.env.NODE_ENV])
  return cached.knex
}
