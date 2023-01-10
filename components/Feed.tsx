import { SyntheticEvent, useCallback } from 'react'
import { useDestroyFeed, useRefreshFeed } from './hooks'
import { Confirm } from './Confirm'
import { FromNow } from './Time'
import { GetFeed } from '../pages/api/feeds'
import Link from 'next/link'
import { useRouter } from 'next/router'

export type FeedCompProps = {
  feed: GetFeed
  onDestroy?: () => void
  onRefresh: () => void
  noTitleLink?: boolean
}

export function FeedComponent(props: FeedCompProps) {
  const {
    feed: { feedId, refreshedAt, title },
    noTitleLink,
    onDestroy,
    onRefresh
  } = props

  const router = useRouter()
  const { trigger: destroyFeed } = useDestroyFeed(feedId)
  const { isMutating: isRefreshing, trigger: refreshFeed } =
    useRefreshFeed(feedId)

  const handleDelete = () =>
    destroyFeed().then(() => {
      if (onDestroy) {
        onDestroy()
      } else {
        router.push('/')
      }
    })

  const handleRefresh = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault()
      refreshFeed().then(() => onRefresh())
    },
    [onRefresh, refreshFeed]
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
