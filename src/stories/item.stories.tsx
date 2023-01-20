import { ItemComponent, ItemComponentProps } from '../components/Item'
import { Story, action } from '@ladle/react'

export const Default: Story<ItemComponentProps> = ({
  contentSnippet,
  isReadMarking,
  link,
  publishedAt,
  readAt,
  title
}) => (
  <ItemComponent
    contentSnippet={contentSnippet}
    isReadMarking={isReadMarking}
    link={link}
    onMarkAsRead={action('onMarkAsRead')}
    onMarkAsUnread={action('onMarkAsUnread')}
    publishedAt={publishedAt}
    readAt={readAt}
    title={title}
  />
)

Default.args = {
  contentSnippet: 'New RSS tutorial on W3Schools',
  isReadMarking: false,
  link: 'https://www.example.com',
  publishedAt: Date.now() - 20 * 60 * 1000,
  readAt: Date.now() - 10 * 60 * 1000,
  title: 'RSS Tutorial'
} as ItemComponentProps

export const Unread: Story<ItemComponentProps> = ({
  contentSnippet,
  isReadMarking,
  link,
  publishedAt,
  title
}) => (
  <ItemComponent
    contentSnippet={contentSnippet}
    isReadMarking={isReadMarking}
    link={link}
    onMarkAsRead={action('onMarkAsRead')}
    onMarkAsUnread={action('onMarkAsUnread')}
    publishedAt={publishedAt}
    title={title}
  />
)

Unread.args = {
  contentSnippet: 'New RSS tutorial on W3Schools',
  isReadMarking: false,
  link: 'https://www.example.com',
  publishedAt: Date.now() - 20 * 60 * 1000,
  title: 'RSS Tutorial'
} as ItemComponentProps
