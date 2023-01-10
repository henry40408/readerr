import { FeedComponent } from '../components/Feed'
import Head from 'next/head'
import { Loading } from '../components/Loading'
import { LoginButton } from '../components/LoginButton'
import { title } from '../helpers'
import { trpc } from '../utils/trpc'
import { useForm } from 'react-hook-form'
import { useSession } from 'next-auth/react'

export type NewFeedFormValues = {
  feedUrl: string
}

function NewFeedForm() {
  const feeds = trpc.getFeeds.useQuery(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<NewFeedFormValues>()
  const createFeedM = trpc.createFeed.useMutation({
    onSuccess: () => {
      feeds.refetch()
      reset()
    }
  })
  const onSubmit = handleSubmit(async (data) => {
    const { feedUrl } = data
    createFeedM.mutate({ feedUrl })
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

function FeedsComponent() {
  const feeds = trpc.getFeeds.useQuery(null)
  const onRefresh = () => feeds.refetch()
  return (
    <>
      {feeds.isLoading && <Loading />}
      {feeds.data && (
        <>
          <NewFeedForm />
          <h1>
            {feeds.data?.length} feed{feeds.data?.length === 1 ? '' : 's'}
          </h1>
          {feeds.data?.map((feed) => {
            const { feedId } = feed
            return (
              <FeedComponent key={feedId} feed={feed} onRefresh={onRefresh} />
            )
          })}
        </>
      )}
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
      {status === 'authenticated' && <FeedsComponent />}
    </>
  )
}
