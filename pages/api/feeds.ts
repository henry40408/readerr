import { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'
import { getKnex } from '../../knex'
import { getFeeds, GetFeeds } from '../../knex/users'

export type FeedsApiResponse = {
  feeds?: GetFeeds
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = await getToken({ req })
  if (!token) return res.status(401).json({})

  const { userId } = token
  if (!userId) return res.status(401).json({})

  const knex = getKnex()
  const feeds = await getFeeds(knex, userId)
  return res.status(200).json({ feeds })
}
