import NextAuth, { DefaultSession } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    userId: number
  }
  interface Session {
    userId?: number
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: number
    username?: string
  }
}
