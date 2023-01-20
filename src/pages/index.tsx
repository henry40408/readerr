import { FeedComponent, FeedComponentProps } from '../components/Feed'
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

interface OneFeedProps extends FeedComponentProps {
  feedId: number
}

function OneFeed(props: OneFeedProps) {
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
    async function run() {
      await refreshMutation.mutateAsync([props.feedId])
      props.onRefresh?.(props.feedId)
    }
    run()
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

  const onDestroy = () => {
    feeds.refetch()
    unreads.refetch()
  }

  const onRefresh = () => {
    feeds.refetch()
    unreads.refetch()
  }

  const onNewFeedSubmit = () => feeds.refetch()

  const onRefreshAll = (e: SyntheticEvent) => {
    e.preventDefault()
    async function run() {
      if (!feeds.isSuccess) return
      await refreshAllMutation.mutateAsync(feeds.data.map((f) => f.feedId))
      feeds.refetch()
      unreads.refetch()
    }
    run()
  }

  return (
    <>
      <NewFeedForm onSubmit={onNewFeedSubmit} />
      <p>
        {refreshAllMutation.isLoading ? (
          '...'
        ) : (
          <a href="#" onClick={onRefreshAll}>
            Refresh all
          </a>
        )}
      </p>
      <h1>
        {feeds.data && (
          <>
            {feeds.data.length} feed{feeds.data.length === 1 ? '' : 's'}
          </>
        )}
      </h1>
      {feeds.data?.map((feed) => {
        const { feedId, refreshedAt, title } = feed
        const unread = unreads?.data?.find((r) => r.feedId === feedId)
        return (
          <OneFeed
            key={feedId}
            feedId={feedId}
            isRefreshing={
              refreshAllMutation.isLoading ||
              feeds.isLoading ||
              unreads.isLoading
            }
            onDestroy={onDestroy}
            onRefresh={onRefresh}
            refreshedAt={refreshedAt}
            title={title}
            unread={Number(unread?.count || 0)}
          />
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
