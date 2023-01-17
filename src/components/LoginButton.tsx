import { signIn, signOut, useSession } from 'next-auth/react'
import { useCallback } from 'react'

export function LoginButton() {
  const { status } = useSession()
  const handleSignIn = useCallback(() => signIn(), [])
  const handleSignOut = useCallback(() => signOut(), [])
  if (status === 'loading') return <div>authenticating...</div>
  if (status === 'authenticated')
    return <button onClick={handleSignOut}>Sign out</button>
  return <button onClick={handleSignIn}>Sign in</button>
}
