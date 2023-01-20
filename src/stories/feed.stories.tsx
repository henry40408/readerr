import { FeedComponent, FeedComponentProps } from '../components/Feed'
import { Story, action } from '@ladle/react'

export const Default: Story<FeedComponentProps> = ({
  isRefreshing,
  refreshedAt,
  title,
  unread
}) => {
  return (
    <>
      <FeedComponent
        isRefreshing={isRefreshing}
        onClick={action('onClick')}
        onDestroy={action('onDestroy')}
        onRefresh={action('onRefresh')}
        refreshedAt={refreshedAt}
        title={title}
        unread={unread}
      />
    </>
  )
}

Default.args = {
  isRefreshing: false,
  refreshedAt: Date.now() - 10 * 60 * 1000,
  title: 'NASA Breaking News',
  unread: 0
} as FeedComponentProps
