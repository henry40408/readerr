import { useRouter } from 'next/router'
import useSWR from 'swr'
import { useSession } from 'next-auth/react'

const fetcher = (url) => fetch(url).then((r) => r.json())

function Feed({ title }) {
  return (
    <>
      <h1>{title}</h1>
    </>
  )
}

function Item({ title, link }) {
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
  const { data: session } = useSession()

  const router = useRouter()
  const { feedId } = router.query

  const { data, isLoading } = useSWR(
    session ? `/api/feeds/${feedId}/items` : null,
    fetcher
  )

  if (session) {
    if (!isLoading && data) {
      const {
        feed: { title },
        items
      } = data
      const renderedItems = items.map((item) => {
        const { title, link, guid } = item
        return <Item key={guid} title={title} link={link} />
      })
      return (
        <>
          <Feed title={title} />
          {renderedItems}
        </>
      )
    }
    return <div />
  }
  return <div />
}
