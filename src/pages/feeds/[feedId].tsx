import { GetServerSideProps, GetServerSidePropsContext } from 'next'
import { Confirm } from '../../components/Confirm'
import { FeedComponent } from '../../components/Feed'
import Head from 'next/head'
import { ItemComponent } from '../../components/Item'
import Link from 'next/link'
import { LoginButton } from '../../components/LoginButton'
import { title } from '../../helpers'
import { trpc } from '../../utils/trpc'

export default function FeedPage(props: PageProps) {
  const feed = trpc.feed.get.useQuery(props.feedId)
  const items = trpc.feed.items.useQuery(props.feedId)
  const unreads = trpc.feed.count.unreads.useQuery([props.feedId])

  const refreshMutation = trpc.feed.refresh.useMutation()
  const markAllAsReadMutation = trpc.feed.markAsRead.useMutation()

  const onRefresh = () => {
    async function run() {
      await refreshMutation.mutateAsync([props.feedId])
      feed.refetch()
      unreads.refetch()
      items.refetch()
    }
    run()
  }

  const handleMarkAllAsRead = async () => {
    if (!items.isSuccess) return
    await markAllAsReadMutation.mutateAsync(
      items.data?.items.map((i) => i.itemId)
    )
    onRefresh()
  }

  return (
    <>
      <Head>
        <title>
          {feed.data && unreads.data?.[0] && title(`(${unreads.data[0].unreadCount}) ${feed.data.title}`)}
        </title>
      </Head>
      <LoginButton />
      <p>
        <Link href="/">Home</Link>
      </p>
      {feed.data && unreads.data?.[0]?.unreadCount !== undefined && (
        <FeedComponent
          isRefreshing={refreshMutation.isLoading}
          onRefresh={onRefresh}
          refreshedAt={feed.data.refreshedAt}
          title={feed.data.title}
          unread={unreads.data[0].unreadCount}
        />
      )}
      <p>
        <Confirm
          multiple
          message={'Mark ALL as read'}
          onConfirm={handleMarkAllAsRead}
        />
      </p>
      {items.data?.items.map((item) => (
        <ItemComponent
          key={item.itemId}
          item={item}
          onMarkAsRead={onRefresh}
        />
      ))}
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
