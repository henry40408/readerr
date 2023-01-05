import Head from 'next/head'
import Link from 'next/link'

import { LoginButton } from '../components/LoginButton'
import { title } from '../helpers'
import { useFetchFeeds } from '../components/hooks'

export type FeedCompProps = {
  feedId: number
  title: string
}

function FeedComp({ feedId, title }: FeedCompProps) {
  return (
    <>
      <h1>
        <Link href={`/feeds/${feedId}`}>{title}</Link>
      </h1>
    </>
  )
}

export default function IndexPage() {
  const { data } = useFetchFeeds()
  return (
    <>
      <Head>
        <title>{title()}</title>
      </Head>
      <LoginButton />
      {data?.feeds?.map((feed) => {
        const { feedId, title } = feed
        return <FeedComp key={feedId} feedId={feedId} title={title} />
      })}
    </>
  )
}
