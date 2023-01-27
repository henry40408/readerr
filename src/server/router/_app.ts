import { procedure, router } from '../trpc'
import { TRPCError } from '@trpc/server'
import { getKnex } from '../../knex'
import { newRepo } from '../../knex/repository'
import { z } from 'zod'

export const appRouter = router({
  feed: router({
    count: router({
      unreads: procedure
        .input(z.array(z.number()))
        .query(async ({ input: feedIds, ctx }) =>
          ctx.userRepo.feedsUnread(feedIds)
        )
    }),
    create: procedure
      .input(z.object({ feedUrl: z.string() }))
      .mutation(({ input, ctx }) => ctx.userRepo.createFeed(input)),
    destroy: procedure
      .input(z.number())
      .mutation(({ input: feedId, ctx }) => ctx.userRepo.destroyFeed(feedId)),
    get: procedure
      .input(z.number())
      .query(({ input: feedId, ctx }) => ctx.userRepo.getFeed(feedId)),
    items: procedure.input(z.number()).query(async ({ input: feedId, ctx }) => {
      const userId = ctx.userId
      const repo = newRepo(getKnex())
      const userRepo = repo.newUserRepo(userId)

      const feed = await userRepo.getFeed(feedId)
      if (!feed) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      const feedRepo = repo.newFeedRepo(feed.feedId)
      return {
        feed,
        items: await feedRepo.getItems()
      }
    }),
    markAsRead: procedure
      .input(z.array(z.number()))
      .mutation(({ input: itemIds, ctx }) => ctx.userRepo.markAsRead(itemIds)),
    markAsUnread: procedure
      .input(z.array(z.number()))
      .mutation(({ input: itemIds, ctx }) =>
        ctx.userRepo.markAsUnread(itemIds)
      ),
    list: procedure
      .input(z.array(z.number()).optional())
      .query(({ input: feedIds, ctx }) => {
        if (feedIds) {
          return ctx.userRepo.getFeeds({ kind: 'many', feedIds })
        }
        return ctx.userRepo.getFeeds()
      }),
    refresh: procedure
      .input(z.array(z.number()))
      .mutation(({ input: feedIds, ctx }) =>
        Promise.all(feedIds.map((feedId) => ctx.userRepo.refreshFeed(feedId)))
      )
  }),
  items: router({
    unread: router({
      count: procedure.query(({ ctx }) => ctx.userRepo.unreadCount()),
      list: procedure.query(({ ctx }) => ctx.userRepo.unreadItems())
    })
  })
})

export type AppRouter = typeof appRouter
