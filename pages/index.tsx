import Link from 'next/link'

import { useSession, signIn, signOut } from 'next-auth/react'
import useSWR from 'swr'

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
  const { data: session } = useSession()
  const { data } = useSWR(session ? '/api/feeds' : null, fetcher)

  if (session) {
    const renderedFeeds = (data &&
      data.feeds.map((feed: { feedId: number; title: string }) => {
        const { feedId, title } = feed
        return <Feed key={feedId} feedId={feedId} title={title} />
      })) || <div />
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
