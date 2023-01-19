import { FeedComponent, FeedComponentProps } from '../components/Feed'
import { Feed } from 'knex/types/tables'
import Head from 'next/head'
import { LoginButton } from '../components/LoginButton'
import { SyntheticEvent } from 'react'
import { title } from '../helpers'
import { trpc } from '../utils/trpc'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'

export interface NewFeedFormValues {
  feedUrl: string
}

interface NewFeedFormProps {
  onSubmit: () => void
}

function NewFeedForm(props: NewFeedFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<NewFeedFormValues>()
  const createFeedM = trpc.feed.create.useMutation({
    onSuccess: () => {
      reset()
      props.onSubmit()
    }
  })
  const onSubmit = handleSubmit(async (data) => {
    const { feedUrl } = data
    await createFeedM.mutateAsync({ feedUrl })
  })
  return (
    <>
      <h1>New Feed</h1>
      <form onSubmit={onSubmit}>
        <input
          disabled={isSubmitting}
          type="text"
          placeholder="https://www.reddit.com/.rss"
          {...register('feedUrl')}
        />
        <input type="submit" disabled={isSubmitting} />
      </form>
    </>
  )
}

function OneFeed(props: FeedComponentProps & Pick<Feed, 'feedId'>) {
  const router = useRouter()
  const refreshMutation = trpc.feed.refresh.useMutation()
  const destroyMutation = trpc.feed.destroy.useMutation()
  const onClick = () => router.push(`/feeds/${props.feedId}`)
  const onDestroy = () => {
    async function run() {
      await destroyMutation.mutateAsync(props.feedId)
      props.onDestroy?.(props.feedId)
    }
    run()
  }
  const onRefresh = () => {
    refreshMutation.mutateAsync([props.feedId])
  }
  return (
    <FeedComponent
      isRefreshing={props.isRefreshing || refreshMutation.isLoading}
      onClick={onClick}
      onDestroy={onDestroy}
      onRefresh={onRefresh}
      unread={props.unread}
      refreshedAt={props.refreshedAt}
      title={props.title}
    />
  )
}

function FeedListComponent() {
  const feeds = trpc.feed.list.useQuery()
  const unreads = trpc.feed.count.unreads.useQuery(
    feeds.data?.map((f) => f.feedId) || [],
    { enabled: feeds.isSuccess }
  )

  const refreshAllMutation = trpc.feed.refresh.useMutation()

  const handleRefreshAll = (e: SyntheticEvent) => {
    e.preventDefault()
    async function run() {
      if (!feeds.isSuccess) return
      await refreshAllMutation.mutateAsync(feeds.data.map((f) => f.feedId))
      feeds.refetch()
    }
    run()
  }

  const onRefreshAll = () => feeds.refetch()

  return (
    <>
      <NewFeedForm onSubmit={onRefreshAll} />
      <p>
        {refreshAllMutation.isLoading ? (
          '...'
        ) : (
          <a href="#" onClick={handleRefreshAll}>
            Refresh all
          </a>
        )}
      </p>
      <h1>
        {feeds.data && <>{feeds.data.length} feed{feeds.data.length === 1 ? '' : 's'}</>}
      </h1>
      {feeds.data?.map((feed) => {
        const { feedId, refreshedAt, title } = feed
        const unread = unreads?.data?.find((r) => r.feedId === feedId)
        return (
          unread && unread.unreadCount !== undefined && (
            <OneFeed
              key={feedId}
              feedId={feedId}
              isRefreshing={refreshAllMutation.isLoading}
              onDestroy={onRefreshAll}
              refreshedAt={refreshedAt}
              title={title}
              unread={unread.unreadCount}
            />
          )
        )
      })}
    </>
  )
}

export default function IndexPage() {
  const { status } = useSession()
  return (
    <>
      <Head>
        <title>{title('Home')}</title>
      </Head>
      <LoginButton />
      {status === 'authenticated' && <FeedListComponent />}
    </>
  )
}
