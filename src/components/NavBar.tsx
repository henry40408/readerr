import { NavbarItem, NavbarView } from './NavBarView'
import { signIn, signOut, useSession } from 'next-auth/react'
import { trpc } from '../utils/trpc'
import { useRouter } from 'next/router'

export function Navbar() {
  const router = useRouter()
  const { status } = useSession()

  const unread = trpc.count.unread.useQuery(undefined, {
    enabled: status === 'authenticated'
  })

  const handleSignIn = () => signIn()
  const handleSignOut = () => signOut()

  const items: NavbarItem[] = []
  items.push({ key: 'home', label: 'Home', onClick: () => router.push('/') })
  if (status === 'authenticated' && unread.data) {
    items.push({ key: 'sign_out', label: 'Sign out', onClick: handleSignOut })
  } else {
    items.push({ key: 'sign_in', label: 'Sign in', onClick: handleSignIn })
  }

  return <NavbarView items={items} />
}
