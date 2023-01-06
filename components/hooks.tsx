import { FeedApiResponse } from '../pages/api/feeds/[...params]'
import { FeedsApiResponse } from '../pages/api/feeds'
import { apiEndpoint } from '../helpers'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { useSession } from 'next-auth/react'

const fetcher = (path: string) => fetch(apiEndpoint(path)).then((r) => r.json())

const postFetcher = (path: string, { arg }: { arg: unknown }) =>
  fetch(apiEndpoint(path), { method: 'POST', body: JSON.stringify(arg) }).then(
    (r) => r.json()
  )

const deleteFetcher = (path: string) =>
  fetch(apiEndpoint(path), { method: 'DELETE' })

export function useAuthenticatedGet<T, U>(path: string) {
  const { status } = useSession()
  return useSWR<T, U>(status === 'authenticated' ? path : null, fetcher)
}

export function useFetchFeeds() {
  return useAuthenticatedGet<FeedsApiResponse, Error>('/api/feeds')
}

export function useFetchItems(feedId: string) {
  return useAuthenticatedGet<FeedApiResponse, Error>(
    `/api/feeds/${feedId}/items`
  )
}

export function useRefreshFeed(feedId: string) {
  return useSWRMutation<FeedApiResponse, Error>(
    apiEndpoint(`/api/feeds/${feedId}/refresh`),
    postFetcher
  )
}

export function useDestroyFeed(feedId: string) {
  return useSWRMutation(apiEndpoint(`/api/feeds/${feedId}`), deleteFetcher)
}
