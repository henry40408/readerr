import { GetServerSideProps, GetServerSidePropsContext } from 'next'
import { ItemComponent, ItemComponentProps } from '../../components/Item'
import { Confirm } from '../../components/Confirm'
import { FeedComponent } from '../../components/Feed'
import Head from 'next/head'
import Link from 'next/link'
import { LoginButton } from '../../components/LoginButton'
import { SyntheticEvent } from 'react'
import { title } from '../../helpers'
import { trpc } from '../../utils/trpc'

interface OneItemProps extends Omit<ItemComponentProps, 'isReadMarking'> {
  itemId: number
  onReadMarked: () => void
}

function OneItem(props: OneItemProps) {
  const markAsReadMutation = trpc.feed.markAsRead.useMutation()
  const markAsUnreadMutation = trpc.feed.markAsUnread.useMutation()
  const onMarkAsRead = (e: SyntheticEvent) => {
    e.preventDefault()
    async function run() {
      await markAsReadMutation.mutateAsync([props.itemId])
      props.onReadMarked()
    }
    run()
  }
  const onMarkAsUnread = (e: SyntheticEvent) => {
    e.preventDefault()
    async function run() {
      await markAsUnreadMutation.mutateAsync([props.itemId])
      props.onReadMarked()
    }
    run()
  }
  return (
    <ItemComponent
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
  const feed = trpc.feed.get.useQuery(props.feedId)
  const items = trpc.feed.items.useQuery(props.feedId)
  const unreads = trpc.feed.count.unreads.useQuery([props.feedId])

  const refreshMutation = trpc.feed.refresh.useMutation()
  const markAllAsReadMutation = trpc.feed.markAsRead.useMutation()

  const onReadMarked = () => {
    feed.refetch()
    unreads.refetch()
    items.refetch()
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
    onRefresh()
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
      <LoginButton />
      <p>
        <Link href="/">Home</Link>
      </p>
      {feed.data && (
        <FeedComponent
          isRefreshing={refreshMutation.isLoading}
          onRefresh={onRefresh}
          refreshedAt={feed.data.refreshedAt}
          title={feed.data.title}
          unread={Number(unreads.data?.[0].count || 0)}
        />
      )}
      <p>
        <Confirm
          multiple
          message={'Mark ALL as read'}
          onConfirm={onMarkAllAsRead}
        />
      </p>
      {items.data?.items.map((item) => (
        <OneItem
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
