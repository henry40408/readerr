import { FromNow } from './Time'
import { Tables } from 'knex/types/tables'

export type ItemProps = {
  item: Tables['items']
}

export function ItemComponent(props: ItemProps) {
  return (
    <>
      <h2>
        <a href={props.item.link} target="_blank" rel="noreferrer">
          {props.item.title}
        </a>
      </h2>
      <p>
        {props.item.pubDate && (
          <>
            Published @ <FromNow time={props.item.pubDate} />
          </>
        )}{' '}
        | {props.item.link}
      </p>
      <p>Mark as read</p>
      <p>{props.item.contentSnippet}</p>
    </>
  )
}
