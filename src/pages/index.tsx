import { ItemView, ItemViewProps } from '../components/Item'
import { Feed } from 'knex/types/tables'
import Head from 'next/head'
import { Navbar } from '../components/NavBar'
import { title } from '../helpers'
import { trpc } from '../utils/trpc'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'

function UnreadItem(
  props: ItemViewProps & {
    itemId: number
    feed?: Pick<Feed, 'title' | 'feedId'>
  }
) {
  const router = useRouter()
  const { onMarkAsRead, ...rest } = props
  const markAsReadMutation = trpc.feed.markAsRead.useMutation()
  const handleMarkAsRead = () => {
    async function run() {
      await markAsReadMutation.mutateAsync([props.itemId])
      onMarkAsRead?.()
    }
    run()
  }
  const handleMarkAsUnread = () => void 0
  return (
    <ItemView
      {...rest}
      feedTitle={props.feed?.title}
      onFeedClick={() =>
        props.feed && router.push(`/feeds/${props.feed.feedId}`)
      }
      onMarkAsRead={handleMarkAsRead}
      onMarkAsUnread={handleMarkAsUnread}
    />
  )
}

interface UnreadListProps {
  refreshUnread: () => void
}

function UnreadList(props: UnreadListProps) {
  const items = trpc.items.unread.list.useQuery()
  const feeds = trpc.feed.list.useQuery(
    Array.from(new Set(items.data?.map((i) => i.feedId) || []))
  )
  const onReadMarked = () => {
    items.refetch()
    props.refreshUnread()
  }
  return (
    <>
      {items.data &&
        feeds.data &&
        items.data.map((item) => {
          const feed = feeds.data.find((f) => f.feedId === item.feedId)
          return (
            <UnreadItem
              key={item.itemId}
              {...item}
              feed={feed}
              publishedAt={item.pubDate}
              onMarkAsRead={onReadMarked}
              onMarkAsUnread={onReadMarked}
            />
          )
        })}
    </>
  )
}

export default function IndexPage() {
  const { status } = useSession()
  const unread = trpc.items.unread.count.useQuery(undefined, {
    enabled: status === 'authenticated'
  })
  const refreshUnread = () => {
    unread.refetch()
  }
  return (
    <>
      <Head>
        <title>
          {unread.isSuccess ? title(`Home (${unread.data})`) : title('Home')}
        </title>
      </Head>
      <div className="container mx-auto mt-6">
        <div className="mb-3">
          <Navbar unreadCount={unread.data} />
        </div>
        {status === 'authenticated' && (
          <UnreadList refreshUnread={refreshUnread} />
        )}
      </div>
    </>
  )
}
