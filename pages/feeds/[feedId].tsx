import { GetServerSideProps, GetServerSidePropsContext } from 'next'
import { Confirm } from '../../components/Confirm'
import { FeedComponent } from '../../components/Feed'
import Head from 'next/head'
import { ItemComponent } from '../../components/Item'
import Link from 'next/link'
import { Loading } from '../../components/Loading'
import { LoginButton } from '../../components/LoginButton'
import { title } from '../../helpers'
import { trpc } from '../../utils/trpc'

export default function FeedPage(props: PageProps) {
  const feed = trpc.feed.get.useQuery(props.feedId)
  const items = trpc.feed.items.useQuery(props.feedId)
  const unreads = trpc.feed.count.unreads.useQuery([props.feedId])

  const markAllAsReadMutation = trpc.feed.markAsRead.useMutation()

  const onRefresh = () => {
    feed.refetch()
    unreads.refetch()
    items.refetch()
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
          {feed.isSuccess &&
            title(
              unreads.isSuccess
                ? `(${unreads.data[0]?.unreadCount}) ${feed.data.title}`
                : feed.data.title
            )}
        </title>
      </Head>
      <LoginButton />
      <p>
        <Link href="/">Home</Link>
      </p>
      {feed.isLoading || (unreads.isLoading && <Loading />)}
      {feed.isSuccess && unreads.isSuccess && (
        <FeedComponent
          noTitleLink
          feed={feed.data}
          onRefresh={onRefresh}
          unread={Number(unreads.data[0]?.unreadCount || 0)}
        />
      )}
      <p>
        <Confirm
          multiple
          message={'Mark ALL as read'}
          onConfirm={handleMarkAllAsRead}
        />
      </p>
      {items.isSuccess &&
        items.data.items.map((item) => (
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
