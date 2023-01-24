import { FromNow } from './Time'
import { SyntheticEvent } from 'react'

export interface ItemViewProps {
  contentSnippet?: string
  link?: string
  isReadMarking?: boolean
  onMarkAsRead?: (e: SyntheticEvent) => void
  onMarkAsUnread?: (e: SyntheticEvent) => void
  readAt?: number | null
  publishedAt?: number
  title?: string
}

export function ItemView(props: ItemViewProps) {
  return (
    <div className="mb-3">
      <h2 className="text-2xl mb-1">
        <a
          className="underline"
          href={props.link}
          onClick={props.onMarkAsRead}
          rel="noreferrer"
          target="_blank"
          title={props.link}
        >
          {props.title}
        </a>
      </h2>
      <div className="mb-3">
        {props.publishedAt && (
          <>
            Published @ <FromNow time={props.publishedAt} />
          </>
        )}{' '}
      </div>
      <div className="mb-3">
        {props.isReadMarking && '...'}
        {!props.isReadMarking && props.readAt && (
          <>
            <a className="underline" href="#" onClick={props.onMarkAsUnread}>
              Mark as unread
            </a>
            {' | '}
            Read @ <FromNow time={props.readAt} />
          </>
        )}
        {!props.isReadMarking && !props.readAt && (
          <a className="underline" href="#" onClick={props.onMarkAsRead}>
            Mark as read
          </a>
        )}
      </div>
      <div>{props.contentSnippet}</div>
    </div>
  )
}
