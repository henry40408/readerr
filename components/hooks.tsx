import { useSession } from 'next-auth/react'
import useSWR, { Fetcher } from 'swr'
import useSWRMutation from 'swr/mutation'
import { apiEndpoint } from '../helpers'
import { FeedsApiResponse } from '../pages/api/feeds'
import { FeedApiResponse } from '../pages/api/feeds/[...params]'

const getFeedsFetcher: Fetcher<FeedsApiResponse, string> = (path: string) =>
  fetch(apiEndpoint(path)).then((r) => r.json())

const getFeedFetcher: Fetcher<FeedApiResponse, string> = (path: string) =>
  fetch(apiEndpoint(path)).then((r) => r.json())

const postFeedFetcher: Fetcher<FeedApiResponse, string> = (path: string) =>
  fetch(apiEndpoint(path), { method: 'POST' }).then((r) => r.json())

export function useFetchFeeds() {
  const { status } = useSession()
  const path = status === 'authenticated' ? apiEndpoint('/api/feeds') : null
  const { data, error, isLoading, mutate } = useSWR(path, getFeedsFetcher)
  return { data, error, isLoading, mutate }
}

export function useFetchItems(feedId: string) {
  const { status } = useSession()
  const path =
    status === 'authenticated'
      ? apiEndpoint(`/api/feeds/${feedId}/items`)
      : null
  const { data, error, isLoading, mutate } = useSWR(path, getFeedFetcher)
  return { data, error, isLoading, mutate, path }
}

export function useRefreshFeed(feedId: string) {
  const { status } = useSession()
  const path =
    status === 'authenticated'
      ? apiEndpoint(`/api/feeds/${feedId}/refresh`)
      : null
  const { isMutating, trigger } = useSWRMutation(path, postFeedFetcher)
  return { isMutating, trigger }
}
