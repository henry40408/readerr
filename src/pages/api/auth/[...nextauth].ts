import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { newRepo } from '../../../knex/repository'
import { getKnex } from '../../../knex'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'johndoe' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const repo = newRepo(getKnex())
        if (!credentials) return null

        const { username, password } = credentials
        const user = await repo.authenticate(username, password)
        if (user) return { id: String(user.userId), ...user }

        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.userId
      }
      return token
    },
    async session({ session, token }) {
      session.userId = token.userId
      return session
    }
  }
}

export default NextAuth(authOptions)
