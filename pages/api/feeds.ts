import { getKnex } from '../../knex'
import {
  GetFeed,
  GetFeeds,
  createFeed,
  getFeed,
  getFeeds
} from '../../knex/users'
import { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'

export type FeedsApiResponse = {
  feeds?: GetFeeds
  feed?: GetFeed
}

export type FeedsApiBody = {
  feedUrl: string
}

interface Request extends NextApiRequest {
  body: FeedsApiBody
}

export default async function handle(req: Request, res: NextApiResponse) {
  const token = await getToken({ req })
  if (!token) return res.status(401).json({})

  const { userId } = token
  if (!userId) return res.status(401).json({})

  const knex = getKnex()
  if (req.method === 'POST') {
    const { feedUrl } = req.body
    const [{ feedId }] = await createFeed(knex, userId, { feedUrl })
    const feed = await getFeed(knex, userId, feedId)
    return res.status(201).json({ feed })
  }
  const feeds = await getFeeds(knex, userId)
  return res.status(200).json({ feeds })
}
