import { FromNow } from './Time'
import { SyntheticEvent } from 'react'

export interface ItemComponentProps {
  contentSnippet?: string
  link?: string
  isReadMarking: boolean
  onMarkAsRead?: (e: SyntheticEvent) => void
  onMarkAsUnread?: (e: SyntheticEvent) => void
  readAt?: number | null
  publishedAt?: number
  title?: string
}

export function ItemComponent(props: ItemComponentProps) {
  return (
    <>
      <h2>
        <a
          href={props.link}
          onClick={props.onMarkAsRead}
          target="_blank"
          rel="noreferrer"
          title={props.link}
        >
          {props.title}
        </a>
      </h2>
      <p>
        {props.publishedAt && (
          <>
            Published @ <FromNow time={props.publishedAt} />
          </>
        )}{' '}
      </p>
      <p>
        {props.isReadMarking && '...'}
        {!props.isReadMarking && props.readAt && (
          <>
            <a href="#" onClick={props.onMarkAsUnread}>
              Mark as unread
            </a>
            {' | '}
            Read at <FromNow time={props.readAt} />
          </>
        )}
        {!props.isReadMarking && !props.readAt && (
          <a href="#" onClick={props.onMarkAsRead}>
            Mark as read
          </a>
        )}
      </p>
      <p>{props.contentSnippet}</p>
    </>
  )
}
