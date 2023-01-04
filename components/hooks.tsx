import useSWR, { Fetcher } from 'swr'
import useSWRMutation from 'swr/mutation'
import { apiEndpoint } from '../helpers'
import { FeedsApiResponse } from '../pages/api/feeds/[...params]'

const getFetcher: Fetcher<FeedsApiResponse, string> = (path: string) =>
  fetch(apiEndpoint(path)).then((r) => r.json())

const postFetcher: Fetcher<FeedsApiResponse, string> = (path: string) =>
  fetch(apiEndpoint(path), { method: 'POST' }).then((r) => r.json())

export function useFetchItems(feedId?: number) {
  const path = feedId ? apiEndpoint(`/api/feeds/${feedId}/items`) : null
  const { data, error, isLoading, mutate } = useSWR(path, getFetcher)
  return { data, error, isLoading, mutate, path }
}

export function useRefreshFeed(feedId?: number) {
  const path = feedId ? apiEndpoint(`/api/feeds/${feedId}/refresh`) : null
  const { isMutating, trigger } = useSWRMutation(path, postFetcher)
  return { isMutating, trigger }
}
