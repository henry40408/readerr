const { scrypt } = require('crypto')

const secret = process.env.SECRET_KEY || 'secret'

/**
 * @param {string} password
 * @returns {Promise<string>}
 */
function encrypt(password) {
  return new Promise((resolve, reject) =>
    scrypt(password, secret, 64, (err, encrypted) =>
      err ? reject(err) : resolve(encrypted.toString('hex'))
    )
  )
}
exports.encrypt = encrypt

/**
 * @param {string} hashed
 * @param {string} password
 * @returns {Promise<boolean>}
 */
async function check(hashed, password) {
  const actual = await encrypt(password)
  return actual === hashed
}
exports.check = check

/**
 * @param {import('knex').Knex} knex
 * @param {string} username
 * @param {string} password
 */
exports.authenticate = async (knex, username, password) => {
  const user = await knex('users').where({ username }).first()
  if (!user) return null
  if (!check(user.encryptedPassword, password)) return null
  return user
}
