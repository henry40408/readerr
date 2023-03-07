import { NavbarItem, NavbarView } from './NavBarView'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

interface NavbarProps {
  unreadCount?: number | string
}

export function Navbar(props: NavbarProps) {
  const router = useRouter()
  const { status } = useSession()

  const handleSignIn = () => signIn()
  const handleSignOut = () => signOut()

  const items: NavbarItem[] = []
  if (status === 'authenticated') {
    items.push({
      key: 'unread',
      label:
        props.unreadCount === undefined
          ? 'Unread'
          : `Unread (${props.unreadCount})`,
      onClick: () => router.push('/')
    })
    items.push({
      key: 'feeds',
      label: 'Feeds',
      onClick: () => router.push('/feeds')
    })
    items.push({ key: 'sign_out', label: 'Sign out', onClick: handleSignOut })
  } else {
    items.push({ key: 'sign_in', label: 'Sign in', onClick: handleSignIn })
  }

  return <NavbarView items={items} />
}
