import { signIn, signOut, useSession } from 'next-auth/react'
import { useCallback } from 'react'

export function LoginButton() {
  const { status } = useSession()
  const handleSignIn = useCallback(() => signIn(), [])
  const handleSignOut = useCallback(() => signOut(), [])
  if (status === 'loading') return <div>authenticating...</div>
  if (status === 'authenticated')
    return (
      <button
        className="bg-red-500 text-white py-2 px-4 rounded-full"
        onClick={handleSignOut}
      >
        Sign out
      </button>
    )
  return (
    <button
      className="bg-blue-500 text-white py-2 px-4 rounded-full"
      onClick={handleSignIn}
    >
      Sign in
    </button>
  )
}
