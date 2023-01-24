import { NavbarItem, NavbarView } from '../components/NavBarView'
import { Story, action } from '@ladle/react'

interface ArgTypes {
  authenticated: boolean
  unreadCount: number
}

export const Default: Story<ArgTypes> = (props) => {
  const items: NavbarItem[] = []
  if (props.authenticated) {
    items.push({ key: 'home', label: 'Home', href: '#' })
    items.push({
      key: 'unread',
      label: `Unread (${props.unreadCount})`,
      href: '#'
    })
    items.push({
      key: 'sign_out',
      label: 'Sign out',
      onClick: action('sign out')
    })
  } else {
    items.push({ key: 'sign_in', label: 'Sign in', onClick: action('sign in') })
  }
  return <NavbarView items={items} />
}

Default.args = {
  authenticated: false,
  unreadCount: 47
}
