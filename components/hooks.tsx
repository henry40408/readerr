import { FeedApiResponse } from '../pages/api/feeds/[...params]'
import { FeedsApiResponse } from '../pages/api/feeds'
import { apiEndpoint } from '../helpers'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { useSession } from 'next-auth/react'

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
