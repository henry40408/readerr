import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import useSWR, { useSWRConfig } from 'swr'

import { Loading } from '../../components/Loading'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function Feed({ feedId, title }: { feedId: number; title: string }) {
  const { mutate } = useSWRConfig()
  const handleRefresh = useCallback(() => {
    async function fetchRefresh() {
      try {
        await fetch(`/api/feeds/${feedId}/refresh`, { method: 'POST' })
        mutate(`/api/feeds/${feedId}/items`)
      } catch (err) {
        console.error(`failed to refresh Feed#${feedId}`, err)
      }
    }
    fetchRefresh()
  }, [feedId, mutate])
  return (
    <>
      <h1>{title}</h1>
      <button onClick={handleRefresh}>refresh</button>
    </>
  )
}

function Item({ title, link }: { title: string; link: string }) {
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

export default function Feeds() {
  const { data: session, status } = useSession()

  const router = useRouter()
  const { feedId } = router.query

  const { data, isLoading } = useSWR(
    session ? `/api/feeds/${feedId}/items` : null,
    fetcher
  )

  if (status === 'loading') return <Loading />
  if (session) {
    if (isLoading) return <Loading />
    if (!data) return <div />
    if (!data.feed) return <div>not found</div>
    const {
      feed: { title },
      items
    } = data
    const renderedItems = items.map(
      (item: { title: string; link: string; guid: string }) => {
        const { title, link, guid } = item
        return <Item key={guid} title={title} link={link} />
      }
    )
    return (
      <>
        <Feed feedId={Number(feedId)} title={title} />
        {renderedItems}
      </>
    )
  }
  return <div />
}
