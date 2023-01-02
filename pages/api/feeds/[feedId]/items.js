import { getToken } from 'next-auth/jwt'

import { getKnex } from '../../../../knex'
import { getFeed } from '../../../../knex/users'
import { getItems } from '../../../../knex/feeds'

export default async function feeds(req, res) {
  const token = await getToken({ req })
  if (!token) return res.status(401).json({})

  const knex = getKnex()
  const { userId } = token
  const { feedId } = req.query
  const [feed, items] = await Promise.all([
    getFeed(knex, userId, feedId),
    getItems(knex, feedId)
  ])
  return res.json({ feed, items })
}
