import { Knex } from 'knex'
import { loadEnvConfig } from '@next/env'

const dev = process.env.NODE_ENV !== 'production'
const { DATABASE_URL } = loadEnvConfig('./', dev).combinedEnv

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './development.sqlite3'
    },
    useNullAsDefault: true,
    pool: {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      afterCreate: (conn, cb) => {
        conn.run('PRAGMA foreign_keys = ON', cb)
      }
    }
  },
  test: {
    client: 'sqlite3',
    connection: {
      filename: ':memory:'
    },
    useNullAsDefault: true,
    pool: {
      min: 1,
      max: 1,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      afterCreate: (conn, cb) => {
        conn.run('PRAGMA foreign_keys = ON', cb)
      }
    }
  },
  production: {
    client: 'sqlite3',
    connection: {
      filename: DATABASE_URL || 'production.sqlite3'
    },
    useNullAsDefault: true,
    pool: {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      afterCreate: (conn, cb) => {
        conn.run('PRAGMA foreign_keys = ON', cb)
      }
    }
  }
}

export default config
