import { procedure, router } from '../trpc'
import { TRPCError } from '@trpc/server'
import { createRepository } from '../../knex/repository'
import { getKnex } from '../../knex'
import { z } from 'zod'

export const appRouter = router({
  countUnread: procedure
    .input(z.number())
    .query(async ({ input: feedId, ctx }) => {
      const userId = ctx.userId
      const repo = createRepository(getKnex())
      const userRepo = repo.createUserRepository(userId)

      const feed = await userRepo.getFeed(feedId)
      if (!feed) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      const feedRepo = repo.createFeedRepository(feed.feedId)
      return feedRepo.countUnread()
    }),
  createFeed: procedure
    .input(z.object({ feedUrl: z.string() }))
    .mutation(({ input, ctx }) => {
      const userId = ctx.userId
      const repo = createRepository(getKnex())
      const userRepo = repo.createUserRepository(userId)
      return userRepo.createFeed(input)
    }),
  destroyFeed: procedure
    .input(z.number())
    .mutation(({ input: feedId, ctx }) => {
      const userId = ctx.userId
      const repo = createRepository(getKnex())
      const userRepo = repo.createUserRepository(userId)
      return userRepo.destroyFeed(feedId)
    }),
  getFeeds: procedure.input(z.null()).query(({ ctx }) => {
    const userId = ctx.userId
    const repo = createRepository(getKnex())
    const userRepo = repo.createUserRepository(userId)
    return userRepo.getFeeds()
  }),
  getItems: procedure
    .input(z.number())
    .query(async ({ input: feedId, ctx }) => {
      const userId = ctx.userId
      const repo = createRepository(getKnex())
      const userRepo = repo.createUserRepository(userId)

      const feed = await userRepo.getFeed(feedId)
      if (!feed) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      const feedRepo = repo.createFeedRepository(feed.feedId)
      return {
        feed,
        items: await feedRepo.getItems()
      }
    }),
  refreshFeed: procedure
    .input(z.number())
    .mutation(({ input: feedId, ctx }) => {
      const userId = ctx.userId
      const repo = createRepository(getKnex())
      const userRepo = repo.createUserRepository(userId)
      return userRepo.refreshFeed(feedId)
    })
})

export type AppRouter = typeof appRouter
