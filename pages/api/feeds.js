import { getToken } from 'next-auth/jwt'

import { getKnex } from '../../knex'
import { getFeeds } from '../../knex/users'

export default async function feeds(req, res) {
  const token = await getToken({ req })
  if (!token) return res.status(401).json({})

  const knex = getKnex()
  const { userId } = token
  const feeds = await getFeeds(knex, userId)
  return res.json({ feeds })
}
