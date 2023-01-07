import { FeedComponent } from '../../components/Feed'
import { FromNow } from '../../components/Time'
import Head from 'next/head'
import { Knex } from 'knex'
import Link from 'next/link'
import { Loading } from '../../components/Loading'
import { LoginButton } from '../../components/LoginButton'
import { Tables } from 'knex/types/tables'
import { title } from '../../helpers'
import { useFetchItems } from '../../components/hooks'
import { useRouter } from 'next/router'

export type ItemProps = Knex.ResolveTableType<Tables['items_composite'], 'base'>

function ItemComponent(props: ItemProps) {
  return (
    <>
      <h2>
        <a href={props.link} target="_blank" rel="noreferrer">
          {props.title}
        </a>
      </h2>
      <div>
        Published @ <FromNow time={props.pubDate} /> | {props.link}
      </div>
      <p>{props.contentSnippet}</p>
    </>
  )
}

function ItemListComponent() {
  const router = useRouter()
  const feedId = router.query.feedId as string
  const { data, isLoading } = useFetchItems(feedId)
  if (isLoading) return <Loading />
  return (
    <>
      {data?.items?.map((item) => (
        <ItemComponent
          key={item.hash}
          title={item.title}
          link={item.link}
          pubDate={item.pubDate}
          contentSnippet={item?.contentSnippet}
        />
      ))}
    </>
  )
}

export default function FeedPage() {
  const router = useRouter()
  const feedId = router.query.feedId as undefined | string
  const { data, mutate } = useFetchItems(feedId)
  return (
    <>
      <Head>
        <title>{title(data?.feed?.title)}</title>
      </Head>
      <LoginButton />
      <p>
        <Link href="/">Home</Link>
      </p>
      {data?.feed?.feedId && (
        <>
          <FeedComponent feed={data.feed.feedId} mutate={mutate} />
          <ItemListComponent />
        </>
      )}
    </>
  )
}
