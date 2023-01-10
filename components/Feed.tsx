import { SyntheticEvent, useCallback } from 'react'
import { useDestroyFeed, useRefreshFeed } from './hooks'
import { Confirm } from './Confirm'
import { FromNow } from './Time'
import { GetFeed } from '../pages/api/feeds'
import Link from 'next/link'

export type FeedCompProps = {
  feed: GetFeed
  mutate: () => void
  noTitleLink?: boolean
}

export function FeedComponent(props: FeedCompProps) {
  const {
    feed: { feedId, refreshedAt, title },
    mutate,
    noTitleLink
  } = props

  const { trigger: deleteFeed } = useDestroyFeed(feedId)
  const { isMutating: isRefreshing, trigger: refreshFeed } =
    useRefreshFeed(feedId)

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
        {noTitleLink ? title : <Link href={`/feeds/${feedId}`}>{title}</Link>}
      </h1>
      <div>
        Refresed @ <FromNow time={refreshedAt} /> | {renderRefresh()} |{' '}
        <Confirm message="Delete" callback={handleDelete} />
      </div>
    </>
  )
}
