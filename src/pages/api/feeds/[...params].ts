import { Feed, Item } from 'knex/types/tables'
import { NextApiRequest, NextApiResponse } from 'next'
import { getKnex } from '../../../knex'
import { getToken } from 'next-auth/jwt'
import { newRepo } from '../../../knex/repository'

export type Query = {
  params: string[]
}

export type FeedApiResponse = null | {
  feed?: Partial<Feed>
  items?: Item[]
}

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

  const repo = newRepo(getKnex())
  const userRepo = repo.newUserRepo(userId)
  const feedRepo = repo.newFeedRepo(Number(p1))
  switch (action) {
    case 'items':
      const [feed, items] = await Promise.all([
        userRepo.getFeed(feedRepo.feedId),
        feedRepo.getItems()
      ])
      return res.json({ feed, items })
    case 'refresh':
      if (req.method === 'POST') {
        await userRepo.refreshFeed(feedRepo.feedId)
        return res.status(200).json({})
      }
    default:
      if (req.method === 'DELETE') {
        await userRepo.destroyFeed(feedRepo.feedId)
        return res.status(204).send(null)
      }
      return res.status(404).json({})
  }
}
