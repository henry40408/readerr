import { SyntheticEvent, useCallback } from 'react'
import { FromNow } from './Time'

export interface ItemViewProps {
  contentSnippet?: string
  feedTitle?: string
  isReadMarking?: boolean
  link?: string
  onFeedClick?: () => void
  onMarkAsRead?: (e?: SyntheticEvent) => void
  onMarkAsUnread?: (e?: SyntheticEvent) => void
  publishedAt?: number
  readAt?: number | null
  title?: string
}

export function ItemView(props: ItemViewProps) {
  const { onFeedClick, onMarkAsRead } = props

  const handleClick = useCallback(() => {
    onMarkAsRead?.()
  }, [onMarkAsRead])

  const handleOnFeedClick = useCallback(
    (e: SyntheticEvent) => {
      e.preventDefault()
      onFeedClick?.()
    },
    [onFeedClick]
  )

  return (
    <div
      className={`dark:text-white mb-4 ${props.readAt ? 'text-gray-400' : ''}`}
    >
      <h2 className="text-2xl mb-2">
        <a
          className="underline"
          href={props.link}
          onClick={handleClick}
          rel="noreferrer"
          target="_blank"
          title={props.link}
        >
          {props.title}
        </a>
      </h2>
      <div className="mb-1">
        {props.feedTitle && (
          <span className="mr-1">
            {props.onFeedClick ? (
              <a className="underline" href="#" onClick={handleOnFeedClick}>
                {props.feedTitle}
              </a>
            ) : (
              props.feedTitle
            )}
          </span>
        )}
        {props.readAt && (
          <span className="mr-1">
            Read @ <FromNow time={props.readAt} />
          </span>
        )}
        {props.publishedAt && (
          <span className="mr-1">
            Published @ <FromNow time={props.publishedAt} />
          </span>
        )}
      </div>
      <div className="mb-1">
        {props.isReadMarking && '...'}
        {!props.isReadMarking && props.readAt && (
          <span className="mr-1">
            <a className="underline" href="#" onClick={props.onMarkAsUnread}>
              Mark as unread
            </a>
          </span>
        )}
        {!props.isReadMarking && !props.readAt && (
          <span className="mr-1">
            <a className="underline" href="#" onClick={props.onMarkAsRead}>
              Mark as read
            </a>
          </span>
        )}
      </div>
      <div>{props.contentSnippet}</div>
    </div>
  )
}
