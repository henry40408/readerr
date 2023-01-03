import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'

import { Loading } from '../../components/Loading'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function Feed({ title }: { title: string }) {
  return (
    <>
      <h1>{title}</h1>
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
        <Feed title={title} />
        {renderedItems}
      </>
    )
  }
  return <div />
}
