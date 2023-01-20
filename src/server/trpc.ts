import { TRPCError, inferAsyncReturnType, initTRPC } from '@trpc/server'
import { CreateNextContextOptions } from '@trpc/server/adapters/next'
import { newRepo } from '../knex/repository'
import { getKnex } from '../knex'
import { getSession } from 'next-auth/react'

export const createContext = async (opts: CreateNextContextOptions) => {
  const session = await getSession({ req: opts.req })
  return { session }
}

export type Context = inferAsyncReturnType<typeof createContext>

const t = initTRPC.context<Context>().create()

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  const repo = newRepo(getKnex())
  return next({
    ctx: {
      repo,
      userId: ctx.session.userId,
      userRepo: repo.newUserRepo(ctx.session.userId)
    }
  })
})

export const router = t.router
export const procedure = t.procedure.use(isAuthed)
