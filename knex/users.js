import { scrypt } from 'crypto'

const secret = process.env.NEXTAUTH_SECRET || 'secret'

/**
 * @param {string} password
 * @returns {Promise<string>}
 */
export function encrypt(password) {
  return new Promise((resolve, reject) =>
    scrypt(password, secret, 64, (err, encrypted) =>
      err ? reject(err) : resolve(encrypted.toString('hex'))
    )
  )
}

/**
 * @param {string} hashed
 * @param {string} password
 * @returns {Promise<boolean>}
 */
export async function check(hashed, password) {
  const actual = await encrypt(password)
  return actual === hashed
}

/**
 * @param {import('knex').Knex} knex
 * @param {string} username
 * @param {string} password
 */
export async function authenticate(knex, username, password) {
  const user = await knex('users').where({ username }).first()
  if (!user) return null
  if (!check(user.encryptedPassword, password)) return user
  return user
}
