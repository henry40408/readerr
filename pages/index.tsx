import { FeedComponent } from '../components/Feed'
import Head from 'next/head'
import { Loading } from '../components/Loading'
import { LoginButton } from '../components/LoginButton'
import { SyntheticEvent } from 'react'
import { Tables } from 'knex/types/tables'
import { title } from '../helpers'
import { trpc } from '../utils/trpc'
import { useForm } from 'react-hook-form'
import { useSession } from 'next-auth/react'

export interface NewFeedFormValues {
  feedUrl: string
}

function NewFeedForm() {
  const feeds = trpc.feed.list.useQuery()
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<NewFeedFormValues>()
  const createFeedM = trpc.feed.create.useMutation({
    onSuccess: () => {
      feeds.refetch()
      reset()
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

interface OneFeedProps {
  feed: Pick<Tables['feeds'], 'feedId' | 'refreshedAt'>
  onMutate: () => void
}

function OneFeed(props: OneFeedProps) {
  const unread = trpc.feed.count.unread.useQuery(props.feed.feedId)
  return (
    <FeedComponent
      feed={props.feed}
      onRefresh={props.onMutate}
      onDestroy={props.onMutate}
      unread={unread.data}
    />
  )
}

function FeedListComponent() {
  const feeds = trpc.feed.list.useQuery()
  const refreshM = trpc.feed.refresh.useMutation()
  const onRefresh = () => feeds.refetch()
  const handleRefreshAll = (e: SyntheticEvent) => {
    e.preventDefault()
    async function run() {
      if (!feeds.data) return
      await Promise.all(feeds.data.map((f) => refreshM.mutateAsync(f.feedId)))
      feeds.refetch()
    }
    run()
  }
  if (feeds.isLoading) return <Loading />
  if (feeds.data)
    return (
      <>
        <p>
          <a href="#" onClick={handleRefreshAll}>
            Refresh all
          </a>
        </p>
        <h1>
          {feeds.data.length} feed{feeds.data.length === 1 ? '' : 's'}
        </h1>
        {feeds.data.map((feed) => {
          const { feedId } = feed
          return <OneFeed key={feedId} feed={feed} onMutate={onRefresh} />
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
      {status === 'authenticated' && (
        <>
          <NewFeedForm />
          <FeedListComponent />
        </>
      )}
    </>
  )
}
