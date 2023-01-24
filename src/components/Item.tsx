import { FromNow } from './Time'

export interface ItemViewProps {
  contentSnippet?: string
  link?: string
  isReadMarking?: boolean
  onMarkAsRead?: () => void
  onMarkAsUnread?: () => void
  readAt?: number | null
  publishedAt?: number
  title?: string
}

export function ItemView(props: ItemViewProps) {
  const handleClick = () => {
    props.onMarkAsRead?.()
  }

  return (
    <div className="dark:text-white mb-4">
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
      <div className="mb-2">
        {props.isReadMarking && '...'}
        {!props.isReadMarking && props.readAt && (
          <span className="mr-1">
            <span className="mr-1">
              <a className="underline" href="#" onClick={props.onMarkAsUnread}>
                Mark as unread
              </a>
            </span>
            Read @ <FromNow time={props.readAt} />
          </span>
        )}
        {!props.isReadMarking && !props.readAt && (
          <span className="mr-1">
            <a className="underline" href="#" onClick={props.onMarkAsRead}>
              Mark as read
            </a>
          </span>
        )}
        {props.publishedAt && (
          <span className="mr-1">
            Published @ <FromNow time={props.publishedAt} />
          </span>
        )}
      </div>
      <div>{props.contentSnippet}</div>
    </div>
  )
}
