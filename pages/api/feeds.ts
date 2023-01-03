import { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'

import { getKnex } from '../../knex'
import { getFeeds } from '../../knex/users'

export default async function feeds(req: NextApiRequest, res: NextApiResponse) {
  const token = await getToken({ req })
  if (!token) return res.status(401).json({})

  const knex = getKnex()
  const { userId } = token
  const feeds = await getFeeds(knex, Number(userId))
  return res.json({ feeds })
}
