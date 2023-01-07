import { SyntheticEvent, useCallback } from 'react'
import { useDestroyFeed, useRefreshFeed } from './hooks'
import { Confirm } from './Confirm'
import { FromNow } from './Time'
import { GetFeed } from '../pages/api/feeds'
import Link from 'next/link'

export type FeedCompProps = {
  feed: GetFeed
  mutate: () => void
}

export function FeedComponent({ feed, mutate }: FeedCompProps) {
  const { trigger: deleteFeed } = useDestroyFeed(feed.feedId)
  const { isMutating: isRefreshing, trigger: refreshFeed } = useRefreshFeed(
    feed.feedId
  )

  const handleDelete = () =>
    deleteFeed().then(() => {
      mutate()
    })

  const handleRefresh = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault()
      refreshFeed().then(() => mutate())
    },
    [mutate, refreshFeed]
  )

  const renderRefresh = () =>
    isRefreshing ? (
      <span>...</span>
    ) : (
      <a href="#" onClick={handleRefresh}>
        Refresh
      </a>
    )

  return (
    <>
      <h1>
        <Link href={`/feeds/${feed.feedId}`}>{feed.title}</Link>
      </h1>
      <div>
        Refresed @ <FromNow time={feed.refreshedAt} /> | {renderRefresh()} |{' '}
        <Confirm message="Delete" callback={handleDelete} />
      </div>
    </>
  )
}
