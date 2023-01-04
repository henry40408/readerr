import { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'

import { getKnex } from '../../../knex'
import { getFeed, refreshFeed } from '../../../knex/users'
import { getItems } from '../../../knex/feeds'
import { Knex } from 'knex'

export default async function feeds(req: NextApiRequest, res: NextApiResponse) {
  const token = await getToken({ req })
  if (!token) return res.status(401).json({})

  const knex = getKnex()
  const { userId } = token
  const { feedId: [feedId, action] = [] } = req.query
  switch (action) {
    case 'items':
      return handleItems(knex, Number(userId), Number(feedId), res)
    case 'refresh':
      if (req.method === 'POST') {
        return handleRefresh(knex, Number(userId), Number(feedId), res)
      }
    default:
      return res.status(404).json({})
  }
}

async function handleItems(
  knex: Knex,
  userId: number,
  feedId: number,
  res: NextApiResponse
) {
  const [feed, items] = await Promise.all([
    getFeed(knex, Number(userId), Number(feedId)),
    getItems(knex, Number(feedId))
  ])
  if (!feed) return res.status(404).json({})
  return res.json({ feed, items })
}

async function handleRefresh(
  knex: Knex,
  userId: number,
  feedId: number,
  res: NextApiResponse
) {
  try {
    await refreshFeed(knex, userId, feedId)
    return res.json({})
  } catch (err) {
    console.error(`failed to refresh Feed#${feedId}`, err)
    return res.status(500).json({})
  }
}
