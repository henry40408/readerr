import { SyntheticEvent } from 'react'

export type NavbarItem = { key: string; label: string } & (
  | { href: string; onClick?: never }
  | { href?: never; onClick: (e?: SyntheticEvent) => void }
)

export interface NavbarProps {
  items: NavbarItem[]
}

function NavbarViewItem(props: Omit<NavbarItem, 'key'>) {
  if (props.href) {
    return (
      <a href={props.href} className="underline">
        {props.label}
      </a>
    )
  }

  const onClick = (e: SyntheticEvent) => {
    e.preventDefault()
    props.onClick?.()
  }
  return (
    <a href="#" className="underline" onClick={onClick}>
      {props.label}
    </a>
  )
}

export function NavbarView(props: NavbarProps) {
  return (
    <div className="dark:text-white md:flex">
      <h1 className="md:mr-1">readerr</h1>
      {props.items.map((item) => (
        <div key={item.key} className="md:mr-1">
          <NavbarViewItem {...item} />
        </div>
      ))}
    </div>
  )
}
