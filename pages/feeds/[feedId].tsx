import { useCallback } from 'react'
import Head from 'next/head'

import { LoginButton } from '../../components/LoginButton'
import { title } from '../../helpers'
import { useFetchItems, useRefreshFeed } from '../../components/hooks'
import { Loading } from '../../components/Loading'
import { useRouter } from 'next/router'
import Link from 'next/link'

function FeedComp() {
  const router = useRouter()
  const feedId = router.query.feedId as string

  const { data, mutate } = useFetchItems(feedId)
  const { isMutating, trigger } = useRefreshFeed(feedId)
  const handleRefresh = useCallback(() => {
    async function run() {
      await trigger()
      mutate()
    }
    run()
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

export type ItemCompProps = {
  title: string
  link: string
}

function ItemComp(props: ItemCompProps) {
  return (
    <>
      <h2>{props.title}</h2>
      <p>
        <a href={props.link} target="_blank" rel="noreferrer">
          {props.link}
        </a>
      </p>
    </>
  )
}

function ItemListComp() {
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
            <ItemComp key={item.hash} title={item.title} link={item.link} />
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
      <FeedComp />
      <ItemListComp />
    </>
  )
}
