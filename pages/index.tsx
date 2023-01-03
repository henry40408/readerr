import Link from 'next/link'

import { useSession, signIn, signOut } from 'next-auth/react'
import useSWR from 'swr'

import { Loading } from '../components/Loading'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function Feed({ feedId, title }: { feedId: number; title: string }) {
  return (
    <>
      <h1>
        <Link href={`/feeds/${feedId}`}>{title}</Link>
      </h1>
    </>
  )
}

export default function Home() {
  const { data: session, status } = useSession()
  const { data, isLoading } = useSWR(session ? '/api/feeds' : null, fetcher)

  if (status === 'loading') return <Loading />

  if (status === 'authenticated') {
    if (isLoading || !data) return <Loading />

    const renderedFeeds = data.feeds.map(
      (feed: { feedId: number; title: string }) => {
        const { feedId, title } = feed
        return <Feed key={feedId} feedId={feedId} title={title} />
      }
    )
    return (
      <>
        <button onClick={() => signOut()}>Sign out</button>
        {renderedFeeds}
      </>
    )
  }

  return (
    <>
      <button onClick={() => signIn()}>Sign in</button>
    </>
  )
}
