import { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'
import { getKnex } from '../../../knex'
import { getItems, GetItems } from '../../../knex/feeds'
import { refreshFeed } from '../../../knex/users'

export type Query = {
  params: string[]
}

export type FeedsApiResponse = {
  items?: GetItems
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<FeedsApiResponse>
) {
  const token = await getToken({ req })
  if (!token || !token.userId) return res.status(401).json({})

  const userId = token.userId
  const {
    params: [p1, action]
  } = req.query as Query

  const knex = getKnex()
  const feedId = Number(p1)
  switch (action) {
    case 'items':
      const items = await getItems(knex, feedId)
      return res.json({ items })
    case 'refresh':
      if (req.method === 'POST') {
        await refreshFeed(knex, userId, feedId)
        return res.status(200).json({})
      }
    default:
      return res.status(404).json({})
  }
}
