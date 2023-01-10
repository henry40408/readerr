import { TRPCError, inferAsyncReturnType, initTRPC } from '@trpc/server'
import { CreateNextContextOptions } from '@trpc/server/adapters/next'
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
  return next({
    ctx: { userId: ctx.session.userId }
  })
})

export const router = t.router
export const procedure = t.procedure.use(isAuthed)
