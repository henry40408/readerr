import { SyntheticEvent, useCallback } from 'react'
import { Confirm } from './Confirm'
import { FromNow } from './Time'

export interface FeedComponentProps {
  isRefreshing: boolean
  onClick?: (e: unknown) => void
  onDestroy?: (e: unknown) => void
  onRefresh?: (e: unknown) => void
  refreshedAt: number
  title: string
  unread: number
}

export function FeedComponent(props: FeedComponentProps) {
  const {
    isRefreshing,
    onClick,
    onDestroy,
    onRefresh,
    refreshedAt,
    title,
    unread
  } = props

  const handleClick = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault()
      onClick?.(true)
    },
    [onClick]
  )

  const handleRefresh = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault()
      onRefresh?.(true)
    },
    [onRefresh]
  )

  const withCounter = `(${unread}) ${title}`
  return (
    <div className="mb-3">
      <h1 className="text-3xl mb-3">
        {onClick ? (
          <a className="underline" href="#" onClick={handleClick}>
            {withCounter}
          </a>
        ) : (
          withCounter
        )}
      </h1>
      <div>
        {onRefresh && (
          <>
            {isRefreshing ? (
              '...'
            ) : (
              <a className="underline" href="#" onClick={handleRefresh}>
                Refresh
              </a>
            )}
            {' | '}
          </>
        )}
        {onDestroy && (
          <>
            <Confirm message="Delete" onConfirm={onDestroy} />
            {' | '}
          </>
        )}
        Refresed @ <FromNow time={refreshedAt} />
      </div>
    </div>
  )
}
