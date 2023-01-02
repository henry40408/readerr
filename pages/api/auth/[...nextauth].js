import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import { getKnex } from '../../../knex'
import { authenticate } from '../../../knex/users'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'johndoe' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, _req) {
        const knex = getKnex()
        const { username, password } = credentials
        const user = await authenticate(knex, username, password)
        if (user) return user
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
