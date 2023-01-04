import { signIn, signOut, useSession } from 'next-auth/react'

export function LoginButton() {
  const { status } = useSession()
  if (status === 'loading') return <div>loading...</div>
  if (status === 'authenticated')
    return <button onClick={() => signOut()}>Sign out</button>
  return <button onClick={() => signIn()}>Sign in</button>
}
