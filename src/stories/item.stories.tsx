import { ItemView, ItemViewProps } from '../components/Item'
import { Story, action } from '@ladle/react'

export const Default: Story<ItemViewProps> = (props) => (
  <ItemView
    {...props}
    onMarkAsRead={action('onMarkAsRead')}
    onMarkAsUnread={action('onMarkAsUnread')}
  />
)

Default.args = {
  contentSnippet: 'New RSS tutorial on W3Schools',
  feedLink: '/',
  feedTitle: 'Feed',
  isReadMarking: false,
  link: 'https://www.example.com',
  publishedAt: Date.now() - 20 * 60 * 1000,
  readAt: Date.now() - 10 * 60 * 1000,
  title: 'RSS Tutorial'
} as ItemViewProps

export const Unread: Story<ItemViewProps> = (props) => (
  <ItemView
    {...props}
    onMarkAsRead={action('onMarkAsRead')}
    onMarkAsUnread={action('onMarkAsUnread')}
  />
)

Unread.args = {
  contentSnippet: 'New RSS tutorial on W3Schools',
  isReadMarking: false,
  link: 'https://www.example.com',
  publishedAt: Date.now() - 20 * 60 * 1000,
  title: 'RSS Tutorial'
} as ItemViewProps

export const List = () => (
  <>
    <ItemView
      contentSnippet="First article"
      onMarkAsRead={action('onMarkAsRead')}
      onMarkAsUnread={action('onMarkAsUnread')}
      title="First title"
    />
    <ItemView
      contentSnippet="Second article"
      onMarkAsRead={action('onMarkAsRead')}
      onMarkAsUnread={action('onMarkAsUnread')}
      title="Second title"
    />
    <ItemView
      contentSnippet="Third article"
      onMarkAsRead={action('onMarkAsRead')}
      onMarkAsUnread={action('onMarkAsUnread')}
      title="Third title"
    />
  </>
)
