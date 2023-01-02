import Link from 'next/link'

import { useSession, signIn, signOut } from 'next-auth/react'
import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((r) => r.json())

function Feed({ feedId, title }) {
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
    const renderedFeeds = data.feeds.map((feed) => {
      const { feedId, title } = feed
      return <Feed key={feedId} feedId={feedId} title={title} />
    })
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
