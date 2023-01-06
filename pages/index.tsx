import { apiEndpoint, title } from '../helpers'
import { useDestroyFeed, useFetchFeeds } from '../components/hooks'
import { Confirm } from '../components/Confirm'
import Head from 'next/head'
import Link from 'next/link'
import { Loading } from '../components/Loading'
import { LoginButton } from '../components/LoginButton'
import ky from 'ky'
import { useForm } from 'react-hook-form'

export type FeedCompProps = {
  feedId: string
  title: string
}

function FeedComponent({ feedId, title }: FeedCompProps) {
  const { mutate } = useFetchFeeds()
  const { trigger } = useDestroyFeed(feedId)

  const handleDelete = () =>
    trigger().then(() => {
      mutate()
    })

  return (
    <>
      <h1>
        <Link href={`/feeds/${feedId}`}>{title}</Link>
      </h1>
      <Confirm message="Delete" callback={handleDelete} />
    </>
  )
}

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
  const { data, isLoading } = useFetchFeeds()
  return (
    <>
      {isLoading && <Loading />}
      {data?.feeds && (
        <>
          <NewFeedForm />
          <h1>Feeds</h1>
          {data.feeds.map((feed) => {
            const { feedId, title } = feed
            return <FeedComponent key={feedId} feedId={feedId} title={title} />
          })}
        </>
      )}
    </>
  )
}

export default function IndexPage() {
  return (
    <>
      <Head>
        <title>{title()}</title>
      </Head>
      <LoginButton />
      <FeedsComponent />
    </>
  )
}
