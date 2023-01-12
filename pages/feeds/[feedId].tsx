import { GetServerSideProps, GetServerSidePropsContext } from 'next'
import { FeedComponent } from '../../components/Feed'
import Head from 'next/head'
import { ItemComponent } from '../../components/Item'
import Link from 'next/link'
import { Loading } from '../../components/Loading'
import { LoginButton } from '../../components/LoginButton'
import { title } from '../../helpers'
import { trpc } from '../../utils/trpc'

interface ItemListProps {
  feedId: number
  onRefresh: () => void
}

function ItemListComponent(props: ItemListProps) {
  const items = trpc.feed.items.useQuery(props.feedId)
  const onMarkAsRead = () => {
    items.refetch()
    props.onRefresh()
  }
  if (items.isLoading) return <Loading />
  return (
    <>
      {items.data?.items.map((item) => (
        <ItemComponent
          key={item.hash}
          item={item}
          onMarkAsRead={onMarkAsRead}
        />
      ))}
    </>
  )
}

export default function FeedPage(props: PageProps) {
  const feed = trpc.feed.get.useQuery(props.feedId)
  const unread = trpc.feed.count.unread.useQuery(props.feedId)
  const onRefresh = () => {
    feed.refetch()
    unread.refetch()
  }
  return (
    <>
      <Head>
        <title>{title(feed.data?.title)}</title>
      </Head>
      <LoginButton />
      <p>
        <Link href="/">Home</Link>
      </p>
      {feed.data?.feedId && (
        <FeedComponent
          noTitleLink
          feed={feed.data}
          onRefresh={onRefresh}
          unread={unread.data}
        />
      )}
      <ItemListComponent feedId={props.feedId} onRefresh={onRefresh} />
    </>
  )
}

type PageParams = {
  feedId: string
}

interface PageProps {
  feedId: number
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (
  context: GetServerSidePropsContext
) => {
  const { feedId } = context.params as PageParams
  return {
    props: {
      feedId: Number(feedId)
    }
  }
}
