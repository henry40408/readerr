import { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'
import { getKnex } from '../../../knex'
import { getItems, GetItems } from '../../../knex/feeds'
import { destroyFeed, GetFeed, getFeed, refreshFeed } from '../../../knex/users'

export type Query = {
  params: string[]
}

export type FeedApiResponse =
  | {
      feed?: GetFeed
      items?: GetItems
    }
  | ''

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<FeedApiResponse>
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
      const [feed, items] = await Promise.all([
        getFeed(knex, userId, feedId),
        getItems(knex, feedId)
      ])
      return res.json({ feed, items })
    case 'refresh':
      if (req.method === 'POST') {
        await refreshFeed(knex, userId, feedId)
        return res.status(200).json({})
      }
    default:
      if (req.method === 'DELETE') {
        await destroyFeed(knex, userId, feedId)
        return res.status(204).send('')
      }
      return res.status(404).json({})
  }
}
