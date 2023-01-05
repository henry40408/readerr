import Head from 'next/head'
import Link from 'next/link'

import { LoginButton } from '../components/LoginButton'
import { title } from '../helpers'
import { useDestroyFeed, useFetchFeeds } from '../components/hooks'
import { Confirm } from '../components/Confirm'
import { Loading } from '../components/Loading'
import { useCallback } from 'react'

export type FeedCompProps = {
  feedId: number
  title: string
}

function FeedComp({ feedId, title }: FeedCompProps) {
  const { mutate } = useFetchFeeds()
  const { trigger } = useDestroyFeed(feedId)

  const handleConfirm = useCallback(() => {
    trigger().then(() => mutate())
  }, [mutate, trigger])

  return (
    <>
      <h1>
        <Link href={`/feeds/${feedId}`}>{title}</Link>
      </h1>
      <Confirm message="Delete" callback={handleConfirm} />
    </>
  )
}

export default function IndexPage() {
  const { data, isLoading } = useFetchFeeds()
  return (
    <>
      <Head>
        <title>{title()}</title>
      </Head>
      <LoginButton />
      {isLoading && <Loading />}
      {data?.feeds?.map((feed) => {
        const { feedId, title } = feed
        return <FeedComp key={feedId} feedId={feedId} title={title} />
      })}
    </>
  )
}
