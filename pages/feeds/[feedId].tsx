import { useFetchItems, useRefreshFeed } from '../../components/hooks'
import Head from 'next/head'
import Link from 'next/link'
import { Loading } from '../../components/Loading'
import { LoginButton } from '../../components/LoginButton'
import { title } from '../../helpers'
import { useCallback } from 'react'
import { useRouter } from 'next/router'

function FeedComponent() {
  const router = useRouter()
  const feedId = router.query.feedId as string

  const { data, mutate } = useFetchItems(feedId)
  const { isMutating, trigger } = useRefreshFeed(feedId)
  const handleRefresh = useCallback(() => {
    trigger().then(() => mutate())
  }, [mutate, trigger])

  if (data?.feed)
    return (
      <>
        <h1>{data.feed.title}</h1>
        <button disabled={isMutating} onClick={handleRefresh}>
          {isMutating ? 'refreshing...' : 'refresh'}
        </button>
      </>
    )

  return <div />
}

export type ItemProps = {
  title: string
  link: string
}

function ItemComponent(props: ItemProps) {
  return (
    <>
      <h2>
        <a href={props.link} target="_blank" rel="noreferrer">
          {props.title}
        </a>
      </h2>
      <div>{props.link}</div>
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
      {data?.items?.map(
        (item) =>
          item?.title &&
          item?.link && (
            <ItemComponent
              key={item.hash}
              title={item.title}
              link={item.link}
            />
          )
      )}
    </>
  )
}

export default function FeedPage() {
  const router = useRouter()
  const feedId = router.query.feedId as string
  const { data } = useFetchItems(feedId)
  return (
    <>
      <Head>
        <title>{title(data?.feed?.title)}</title>
      </Head>
      <LoginButton />
      <p>
        <Link href="/">Home</Link>
      </p>
      <FeedComponent />
      <ItemListComponent />
    </>
  )
}
