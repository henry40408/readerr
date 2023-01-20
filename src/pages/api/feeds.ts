import { NextApiRequest, NextApiResponse } from 'next'
import { Feed } from 'knex/types/tables'
import { newRepo } from '../../knex/repository'
import { getKnex } from '../../knex'
import { getToken } from 'next-auth/jwt'

export interface FeedsApiResponse {
  feeds?: Partial<Feed>[]
  feed?: Partial<Feed>
}

export interface FeedsApiBody {
  feedUrl: string
}

interface Request extends NextApiRequest {
  body: FeedsApiBody
}

export default async function handle(
  req: Request,
  res: NextApiResponse<FeedsApiResponse>
) {
  const token = await getToken({ req })
  if (!token) return res.status(401).json({})

  const { userId } = token
  if (!userId) return res.status(401).json({})

  const userRepo = newRepo(getKnex()).newUserRepo(userId)
  if (req.method === 'POST') {
    const { feedUrl } = req.body
    const [{ feedId }] = await userRepo.createFeed({ feedUrl })
    const feed = await userRepo.getFeed(feedId)
    return res.status(201).json({ feed })
  }

  const feeds = await userRepo.getFeeds()
  return res.status(200).json({ feeds })
}
