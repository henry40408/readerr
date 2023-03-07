import { GetServerSideProps, GetServerSidePropsContext } from 'next'
import { ItemView, ItemViewProps } from '../../components/Item'
import { Confirm } from '../../components/Confirm'
import { FeedView } from '../../components/Feed'
import Head from 'next/head'
import { Navbar } from '../../components/NavBar'
import { SyntheticEvent } from 'react'
import { title } from '../../helpers'
import { trpc } from '../../utils/trpc'

interface ItemListItemProps extends Omit<ItemViewProps, 'isReadMarking'> {
  itemId: number
  onReadMarked: () => void
}

function ItemListItem(props: ItemListItemProps) {
  const markAsReadMutation = trpc.feed.markAsRead.useMutation()
  const markAsUnreadMutation = trpc.feed.markAsUnread.useMutation()

  const onMarkAsRead = (e?: SyntheticEvent) => {
    e?.preventDefault()
    async function run() {
      await markAsReadMutation.mutateAsync([props.itemId])
      props.onReadMarked()
    }
    run()
  }

  const onMarkAsUnread = (e?: SyntheticEvent) => {
    e?.preventDefault()
    async function run() {
      await markAsUnreadMutation.mutateAsync([props.itemId])
      props.onReadMarked()
    }
    run()
  }

  return (
    <ItemView
      contentSnippet={props.contentSnippet}
      link={props.link}
      isReadMarking={
        markAsReadMutation.isLoading || markAsUnreadMutation.isLoading
      }
      onMarkAsRead={onMarkAsRead}
      onMarkAsUnread={onMarkAsUnread}
      publishedAt={props.publishedAt}
      readAt={props.readAt}
      title={props.title}
    />
  )
}

export default function FeedPage(props: PageProps) {
  const count = trpc.items.unread.count.useQuery()
  const feed = trpc.feed.get.useQuery(props.feedId)
  const items = trpc.feed.items.useQuery(props.feedId)
  const unreads = trpc.feed.count.unreads.useQuery([props.feedId])

  const refreshMutation = trpc.feed.refresh.useMutation()
  const markAllAsReadMutation = trpc.feed.markAsRead.useMutation()

  const onReadMarked = () => {
    count.refetch()
    feed.refetch()
    items.refetch()
    unreads.refetch()
  }

  const onRefresh = () => {
    async function run() {
      await refreshMutation.mutateAsync([props.feedId])
      onReadMarked()
    }
    run()
  }

  const onMarkAllAsRead = async () => {
    if (!items.data) return
    await markAllAsReadMutation.mutateAsync(
      items.data?.items.map((i) => i.itemId)
    )
    onReadMarked()
  }

  return (
    <>
      <Head>
        <title>
          {feed.data &&
            unreads.data?.[0] &&
            title(`(${unreads.data[0].count || 0}) ${feed.data.title}`)}
        </title>
      </Head>
      <div className="container mx-auto mt-6">
        <div className="mb-3">
          <Navbar unreadCount={count.data} />
        </div>
        <div className="mb-3">
          {feed.data && (
            <>
              <FeedView
                isRefreshing={refreshMutation.isLoading}
                onRefresh={onRefresh}
                refreshedAt={feed.data.refreshedAt}
                title={feed.data.title}
                unread={Number(unreads.data?.[0]?.count || 0)}
              />
              <div className="mb-3">
                <Confirm
                  multiple
                  message={'Mark ALL as read'}
                  onConfirm={onMarkAllAsRead}
                />
              </div>
            </>
          )}
          {!feed.data && <div>not found</div>}
        </div>
        {items.data?.items.map((item) => (
          <ItemListItem
            key={item.itemId}
            contentSnippet={item.contentSnippet}
            itemId={item.itemId}
            link={item.link}
            onReadMarked={onReadMarked}
            readAt={item.readAt}
            publishedAt={item.pubDate}
            title={item.title}
          />
        ))}
      </div>
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
