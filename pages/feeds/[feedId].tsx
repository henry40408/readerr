import { ParsedUrlQuery } from 'querystring'

import { useCallback } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { getToken } from 'next-auth/jwt'

import { getKnex } from '../../knex'
import { GetFeed, getFeed } from '../../knex/users'
import { LoginButton } from '../../components/LoginButton'
import { title } from '../../helpers'
import { useFetchItems, useRefreshFeed } from '../../components/hooks'
import { Loading } from '../../components/Loading'

export type PageProps = {
  feed: GetFeed | null
}

export interface Params extends ParsedUrlQuery {
  feedId: string
}

export type FeedCompProps = {
  feedId: number
  title: string
}

function FeedComp(props: FeedCompProps) {
  const { mutate } = useFetchItems(props.feedId)
  const { isMutating, trigger } = useRefreshFeed(props.feedId)
  const handleRefresh = useCallback(() => {
    async function run() {
      await trigger()
      mutate()
    }
    run()
  }, [mutate, trigger])
  return (
    <>
      <h1>{props.title}</h1>
      <button disabled={isMutating} onClick={handleRefresh}>
        {isMutating ? 'refreshing...' : 'refresh'}
      </button>
    </>
  )
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

export type ItemsCompProps = {
  feedId: number
}

function ItemListComp(props: ItemsCompProps) {
  const { data, isLoading } = useFetchItems(props.feedId)
  if (isLoading) return <Loading />
  return (
    <>
      {data?.items?.map(
        (item) =>
          item?.title &&
          item?.link && (
            <ItemComp key={item.guid} title={item.title} link={item.link} />
          )
      )}
    </>
  )
}

export default function FeedPage(props: PageProps) {
  const { feed } = props
  return (
    <>
      <Head>
        <title>{title(feed?.title)}</title>
      </Head>
      <LoginButton />
      {feed?.feedId && feed?.title && (
        <FeedComp title={feed.title} feedId={feed.feedId} />
      )}
      {feed && <ItemListComp feedId={feed.feedId} />}
    </>
  )
}

export const getServerSideProps: GetServerSideProps<PageProps, Params> = async (
  context
) => {
  const feedId = context.params?.feedId
  const token = await getToken({ req: context.req })
  const knex = getKnex()
  const feed = token?.userId
    ? await getFeed(knex, token.userId, Number(feedId))
    : null
  return {
    props: {
      feed
    }
  }
}
