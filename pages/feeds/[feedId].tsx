import { ParsedUrlQuery } from 'querystring'

import { GetServerSideProps } from 'next'
import { getToken } from 'next-auth/jwt'
import { Item } from 'knex/types/tables'

import { getKnex } from '../../knex'
import { getItems } from '../../knex/feeds'
import { GetFeed, getFeed } from '../../knex/users'

import { LoginButton } from '../../components/LoginButton'

export type PageProps = {
  authenticated: boolean
  feed: GetFeed | null
  items: Item[]
}

export interface Params extends ParsedUrlQuery {
  feedId: string
}

function FeedComp({ title }: { title: string }) {
  return (
    <>
      <h1>{title}</h1>
    </>
  )
}

function ItemComp({ title, link }: { title: string; link: string }) {
  return (
    <>
      <h2>{title}</h2>
      <p>
        <a href={link} target="_blank" rel="noreferrer">
          {link}
        </a>
      </p>
    </>
  )
}

export default function Feed(props: PageProps) {
  const { authenticated, feed, items } = props
  if (!authenticated || !feed) {
    return <LoginButton />
  }
  const renderedItems = items.map((item) => {
    const { title, link, guid } = item
    return <ItemComp key={guid} title={title ?? ''} link={link ?? ''} />
  })
  return (
    <>
      <LoginButton />
      <FeedComp title={feed.title ?? ''} />
      {renderedItems}
    </>
  )
}

export const getServerSideProps: GetServerSideProps<PageProps, Params> = async (
  context
) => {
  const { feedId } = context.params!
  const token = await getToken({ req: context.req })
  const knex = getKnex()
  const feed =
    token && token.userId
      ? await getFeed(knex, token.userId, Number(feedId))
      : null
  const items = feed ? await getItems(knex, feed.feedId) : []
  return {
    props: {
      authenticated: Boolean(token),
      feed,
      items
    }
  }
}
