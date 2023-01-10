import { SyntheticEvent, useCallback } from 'react'
import { Confirm } from './Confirm'
import { FromNow } from './Time'
import { GetFeed } from '../pages/api/feeds'
import Link from 'next/link'
import { trpc } from '../utils/trpc'
import { useRouter } from 'next/router'

export type FeedCompProps = {
  feed: GetFeed
  noTitleLink?: boolean
  onDestroy?: () => void
  onRefresh: () => void
}

export function FeedComponent(props: FeedCompProps) {
  const router = useRouter()

  const destroyM = trpc.destroyFeed.useMutation({
    onSuccess: () => {
      if (props.onDestroy) {
        props.onDestroy()
      } else {
        router.push('/')
      }
    }
  })
  const refreshM = trpc.refreshFeed.useMutation({
    onSuccess: () => props.onRefresh()
  })

  const {
    feed: { feedId, refreshedAt, title },
    noTitleLink
  } = props

  const handleDelete = async () => {
    destroyM.mutate(feedId)
  }

  const handleRefresh = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault()
      refreshM.mutate(feedId)
    },
    [feedId, refreshM]
  )

  const renderRefresh = () =>
    refreshM.isLoading ? (
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
