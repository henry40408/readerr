import { Fragment, SyntheticEvent } from 'react'
import { FeedComponent } from '../components/Feed'
import Head from 'next/head'
import { Loading } from '../components/Loading'
import { LoginButton } from '../components/LoginButton'
import { title } from '../helpers'
import { trpc } from '../utils/trpc'
import { useForm } from 'react-hook-form'
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

function FeedListComponent() {
  const feeds = trpc.feed.list.useQuery()
  const unreads = trpc.feed.count.unreads.useQuery(
    feeds.data?.map((f) => f.feedId) || [],
    { enabled: feeds.isSuccess }
  )

  const refreshMutation = trpc.feed.refresh.useMutation()

  const handleRefreshAll = (e: SyntheticEvent) => {
    e.preventDefault()
    async function run() {
      if (!feeds.isSuccess) return
      await Promise.all(
        feeds.data.map((f) => refreshMutation.mutateAsync(f.feedId))
      )
      feeds.refetch()
    }
    run()
  }

  const onRefresh = () => feeds.refetch()

  if (feeds.isLoading) return <Loading />

  if (feeds.isSuccess)
    return (
      <>
        <NewFeedForm onSubmit={onRefresh} />
        <p>
          <a href="#" onClick={handleRefreshAll}>
            Refresh all
          </a>
        </p>
        <h1>
          {feeds.data.length} feed{feeds.data.length === 1 ? '' : 's'}
        </h1>
        {feeds.isSuccess &&
          unreads.isSuccess &&
          feeds.data.map((feed) => {
            const { feedId } = feed
            const unread = unreads.data.find((r) => r.feedId === feedId)
            return (
              <FeedComponent
                key={feedId}
                feed={feed}
                unread={Number(unread?.unreadCount || 0)}
                onDestroy={onRefresh}
                onRefresh={onRefresh}
              />
            )
          })}
      </>
    )
  return <div />
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
