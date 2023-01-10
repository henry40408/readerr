import { apiEndpoint, title } from '../helpers'
import { FeedComponent } from '../components/Feed'
import Head from 'next/head'
import { Loading } from '../components/Loading'
import { LoginButton } from '../components/LoginButton'
import ky from 'ky'
import { useFetchFeeds } from '../components/hooks'
import { useForm } from 'react-hook-form'
import { useSession } from 'next-auth/react'

export type NewFeedFormValues = {
  feedUrl: string
}

function NewFeedForm() {
  const { mutate } = useFetchFeeds()
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<NewFeedFormValues>()
  const onSubmit = handleSubmit(async (data) => {
    const { feedUrl } = data
    if (!feedUrl) return
    return ky
      .post(apiEndpoint('/api/feeds'), {
        json: { feedUrl }
      })
      .json()
      .then(() => {
        reset()
        mutate()
      })
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
  const { data, isLoading, mutate } = useFetchFeeds()
  return (
    <>
      {isLoading && <Loading />}
      {data?.feeds && (
        <>
          <NewFeedForm />
          <h1>
            {data.feeds.length} feed{data.feeds.length === 1 ? '' : 's'}
          </h1>
          {data.feeds.map((feed) => {
            const { feedId } = feed
            return <FeedComponent key={feedId} feed={feed} onRefresh={mutate} />
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
