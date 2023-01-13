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
        <NewFeedForm onSubmit={onRefresh} />
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
          const unread = unreads.data?.find(
            (r) => r.feedId === feedId
          )?.unreadCount
          return (
            <FeedComponent
              key={feedId}
              feed={feed}
              unread={Number(unread || 0)}
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
