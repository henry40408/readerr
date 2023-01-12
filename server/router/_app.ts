import { procedure, router } from '../trpc'
import { TRPCError } from '@trpc/server'
import { createRepository } from '../../knex/repository'
import { getKnex } from '../../knex'
import { z } from 'zod'

export const appRouter = router({
  feed: router({
    create: procedure
      .input(z.object({ feedUrl: z.string() }))
      .mutation(({ input, ctx }) => ctx.userRepo.createFeed(input)),
    count: router({
      unread: procedure
        .input(z.number())
        .query(async ({ input: feedId, ctx }) => {
          const userId = ctx.userId
          const feedRepo = await ctx.repo.createUserFeedRepository(
            userId,
            feedId
          )
          if (!feedRepo) throw new TRPCError({ code: 'NOT_FOUND' })
          return feedRepo.countUnread()
        })
    }),
    destroy: procedure
      .input(z.number())
      .mutation(({ input: feedId, ctx }) => ctx.userRepo.destroyFeed(feedId)),
    items: procedure.input(z.number()).query(async ({ input: feedId, ctx }) => {
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
    list: procedure.query(({ ctx }) => ctx.userRepo.getFeeds()),
    refresh: procedure
      .input(z.number())
      .mutation(({ input: feedId, ctx }) => ctx.userRepo.refreshFeed(feedId))
  })
})

export type AppRouter = typeof appRouter
