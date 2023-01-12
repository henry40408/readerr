import { Confirm } from './Confirm'
import { FromNow } from './Time'
import { GetFeed } from '../pages/api/feeds'
import Link from 'next/link'
import { SyntheticEvent } from 'react'
import { trpc } from '../utils/trpc'
import { useRouter } from 'next/router'

export interface FeedCompProps {
  feed: GetFeed
  noTitleLink?: boolean
  onDestroy?: () => void
  onRefresh: () => void
  unread?: number
}

export function FeedComponent(props: FeedCompProps) {
  const router = useRouter()

  const destroyM = trpc.feed.destroy.useMutation({
    onSuccess: () => {
      if (props.onDestroy) {
        props.onDestroy()
      } else {
        router.push('/')
      }
    }
  })
  const refreshM = trpc.feed.refresh.useMutation({
    onSuccess: () => props.onRefresh()
  })

  const {
    feed: { feedId, refreshedAt, title },
    noTitleLink
  } = props

  const handleDelete = async () => {
    await destroyM.mutateAsync(feedId)
  }

  const handleRefresh = (e: SyntheticEvent) => {
    e.preventDefault()
    async function run() {
      await refreshM.mutateAsync(feedId)
    }
    run()
  }

  const renderRefresh = () =>
    refreshM.isLoading ? (
      <span>...</span>
    ) : (
      <a href="#" onClick={handleRefresh}>
        Refresh
      </a>
    )

  const withCounter = props.unread ? `${title} (${props.unread})` : title
  return (
    <>
      <h1>
        {noTitleLink ? (
          withCounter
        ) : (
          <Link href={`/feeds/${feedId}`}>{withCounter}</Link>
        )}
      </h1>
      <div>
        Refresed @ <FromNow time={refreshedAt} /> | {renderRefresh()} |{' '}
        <Confirm message="Delete" onConfirm={handleDelete} />
      </div>
    </>
  )
}
