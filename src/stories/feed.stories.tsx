import { FeedComponent, FeedComponentProps } from '../components/Feed'
import { Story, action } from '@ladle/react'

export const Default: Story<FeedComponentProps> = ({
  refreshedAt,
  title,
  unread
}) => {
  return (
    <>
      <FeedComponent
        title={title}
        onClick={action('onClick')}
        onDestroy={action('onDestroy')}
        onRefresh={action('onRefresh')}
        refreshedAt={refreshedAt}
        unread={unread}
      />
    </>
  )
}

Default.args = {
  refreshedAt: Date.now() - 10 * 60 * 1000,
  title: 'NASA Breaking News',
  unread: 0
}
