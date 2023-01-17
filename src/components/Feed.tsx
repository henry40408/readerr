import { SyntheticEvent, useCallback } from 'react'
import { Confirm } from './Confirm'
import { FromNow } from './Time'

export interface FeedComponentProps {
  onClick?: (e: unknown) => void
  onDestroy?: (e: unknown) => void
  onRefresh?: (e: unknown) => void
  refreshedAt: number
  title: string
  unread: number
}

export function FeedComponent(props: FeedComponentProps) {
  const { onClick, onDestroy, onRefresh, refreshedAt, title, unread } = props

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

  const withCounter = `${title} (${unread})`
  return (
    <>
      <h1>
        {onClick ? (
          <a href="#" onClick={handleClick}>
            {withCounter}
          </a>
        ) : (
          withCounter
        )}
      </h1>
      <div>
        Refresed @ <FromNow time={refreshedAt} />
        {onDestroy && (
          <>
            {' | '}
            <Confirm message="Delete" onConfirm={onDestroy} />
          </>
        )}
        {onRefresh && (
          <>
            {' | '}
            <a href="#" onClick={handleRefresh}>
              Refresh
            </a>
          </>
        )}
      </div>
    </>
  )
}
