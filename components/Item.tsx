import { FromNow } from './Time'
import { SyntheticEvent } from 'react'
import { Tables } from 'knex/types/tables'
import { trpc } from '../utils/trpc'

export interface ItemProps {
  item: Tables['items']
  onMarkAsRead?: () => void
}

export function ItemComponent(props: ItemProps) {
  const markAsReadM = trpc.feed.markAsRead.useMutation({
    onSuccess: () => props.onMarkAsRead?.()
  })
  const handleMarkAsRead = (e: SyntheticEvent) => {
    e.preventDefault()
    markAsReadM.mutate([props.item.itemId])
  }
  return (
    <>
      <h2>
        <a
          href={props.item.link}
          target="_blank"
          rel="noreferrer"
          title={props.item.link}
        >
          {props.item.title}
        </a>
      </h2>
      <p>
        {props.item.pubDate && (
          <>
            Published @ <FromNow time={props.item.pubDate} />
          </>
        )}{' '}
      </p>
      <p>
        {props.item.readAt && (
          <>
            Read at <FromNow time={props.item.readAt} />
          </>
        )}
        {!props.item.readAt &&
          (markAsReadM.isLoading ? (
            '...'
          ) : (
            <a href="#" onClick={handleMarkAsRead}>
              Mark as read
            </a>
          ))}
      </p>
      <p>{props.item.contentSnippet}</p>
    </>
  )
}
