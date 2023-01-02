import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'johndoe' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(_credentials, _req) {
        const user = { id: '1', name: 'John Doe', email: 'jdoe@example.com' }
        if (user) {
          return user
        } else {
          return null
        }
      }
    })
  ]
}

export default NextAuth(authOptions)
