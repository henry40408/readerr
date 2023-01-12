import { FromNow } from './Time'
import { Tables } from 'knex/types/tables'

export interface ItemProps {
  item: Tables['items']
}

export function ItemComponent(props: ItemProps) {
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
      <p>Mark as read</p>
      <p>{props.item.contentSnippet}</p>
    </>
  )
}
