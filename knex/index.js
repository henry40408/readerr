const knex = require('knex')
const config = require('../knexfile')

let cached = global.cached
if (!cached) cached = global.cached = {}

/**
 * @returns {import('Knex').Knex}
 */
export function getKnex() {
  if (!cached.knex) cached.knex = knex(config[process.env.NODE_ENV])
  return cached.knex
}
