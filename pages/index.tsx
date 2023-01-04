import { GetServerSideProps } from 'next'
import Link from 'next/link'

import { getToken } from 'next-auth/jwt'
import { Feed } from 'knex/types/tables'

import { getFeeds } from '../knex/users'
import { getKnex } from '../knex'
import { LoginButton } from '../components/LoginButton'

export type PageProps = {
  authenticated: boolean
  feeds: Pick<Feed, 'feedId' | 'title'>[]
}

function FeedComp({ feedId, title }: { feedId: number; title: string }) {
  return (
    <>
      <h1>
        <Link href={`/feeds/${feedId}`}>{title}</Link>
      </h1>
    </>
  )
}

export default function Home({ feeds }: PageProps) {
  const renderedFeeds = feeds?.map((feed) => {
    const { feedId, title } = feed
    return <FeedComp key={feedId} feedId={feedId} title={title} />
  })
  return (
    <>
      <LoginButton />
      {renderedFeeds}
    </>
  )
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (
  context
) => {
  const token = await getToken({ req: context.req })
  const feeds =
    token && token.userId ? await getFeeds(getKnex(), token.userId) : []
  return {
    props: {
      authenticated: Boolean(token),
      feeds
    }
  }
}
