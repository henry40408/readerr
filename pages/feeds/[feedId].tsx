import { GetServerSideProps, GetServerSidePropsContext } from 'next'
import { FeedComponent } from '../../components/Feed'
import { FromNow } from '../../components/Time'
import Head from 'next/head'
import Link from 'next/link'
import { Loading } from '../../components/Loading'
import { LoginButton } from '../../components/LoginButton'
import { Tables } from 'knex/types/tables'
import { title } from '../../helpers'
import { useFetchItems } from '../../components/hooks'
import { useRouter } from 'next/router'

export type ItemProps = {
  item: Tables['items']
}

function ItemComponent(props: ItemProps) {
  return (
    <>
      <h2>
        <a href={props.item.link} target="_blank" rel="noreferrer">
          {props.item.title}
        </a>
      </h2>
      <p>
        {props.item.pubDate && (
          <>
            Published @ <FromNow time={props.item.pubDate} />
          </>
        )}{' '}
        | {props.item.link}
      </p>
      <p>Mark as read</p>
      <p>{props.item.contentSnippet}</p>
    </>
  )
}

function ItemListComponent() {
  const router = useRouter()
  const feedId = router.query.feedId as string
  const { data, isLoading } = useFetchItems(feedId)
  if (isLoading) return <Loading />
  return (
    <>
      {data?.items?.map((item) => (
        <ItemComponent key={item.hash} item={item} />
      ))}
    </>
  )
}

export default function FeedPage(props: PageProps) {
  const { data, mutate } = useFetchItems(props.feedId)
  return (
    <>
      <Head>
        <title>{title(data?.feed?.title)}</title>
      </Head>
      <LoginButton />
      <p>
        <Link href="/">Home</Link>
      </p>
      {data?.feed?.feedId && (
        <>
          <FeedComponent feed={data.feed} mutate={mutate} />
          <ItemListComponent />
        </>
      )}
    </>
  )
}

type PageParams = {
  feedId: string
}

type PageProps = {
  feedId: string
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (
  context: GetServerSidePropsContext
) => {
  const { feedId } = context.params as PageParams
  return {
    props: {
      feedId
    }
  }
}
