import { FeedApiResponse } from '../pages/api/feeds/[...params]'
import { FeedsApiResponse } from '../pages/api/feeds'
import { apiEndpoint } from '../helpers'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'

export type FetchError = {
  json: unknown
  status: number
}

const fetcher = async (path: string) => {
  const res = await fetch(apiEndpoint(path))
  if (!res.ok) {
    throw { json: await res.json(), status: res.status }
  }
  return res.json()
}

const postFetcher = async (path: string, { arg }: { arg: unknown }) => {
  const res = await fetch(apiEndpoint(path), {
    method: 'POST',
    body: JSON.stringify(arg)
  })
  if (!res.ok) {
    throw { json: await res.json(), status: res.status }
  }
  return res.json()
}

const deleteFetcher = async (path: string) => {
  const res = await fetch(apiEndpoint(path), { method: 'DELETE' })
  if (!res.ok) {
    throw { json: null, status: res.status }
  }
  return null
}

export function useFetchFeed(feedId: null | number | string) {
  return useSWR<FeedApiResponse, Error>(
    feedId ? `/api/feeds/${feedId}` : null,
    fetcher
  )
}

export function useFetchFeeds() {
  return useSWR<FeedsApiResponse, Error>('/api/feeds', fetcher)
}

export function useFetchItems(feedId: undefined | string) {
  return useSWR<FeedApiResponse, Error>(
    feedId && `/api/feeds/${feedId}/items`,
    fetcher
  )
}

export function useRefreshFeed(feedId: number) {
  return useSWRMutation<FeedApiResponse, Error>(
    apiEndpoint(`/api/feeds/${feedId}/refresh`),
    postFetcher
  )
}

export function useDestroyFeed(feedId: number) {
  return useSWRMutation(apiEndpoint(`/api/feeds/${feedId}`), deleteFetcher)
}
