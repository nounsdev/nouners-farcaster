import { fetchRequest, HttpRequestMethod } from '@/services/warpcast/index'
import { Item } from './types'

interface Result {
  items: Item[]
  latestMainCastTimestamp: number
  feedTopSeenAtTimestamp: number
  replaceFeed: boolean
}

interface Response {
  result: Result
}

/**
 * Fetches feed items from a specified URL using the provided arguments.
 * @async
 * @param env - The environment settings.
 * @param feedKey - The key of the feed.
 * @param feedType - The type of the feed.
 * @returns - A promise that resolves to an array of feed items if the request is successful, otherwise an empty array.
 * @throws {Error} If an HTTP error occurs during the request.
 */
export const getFeedItems = async (
  env: Env,
  feedKey: string,
  feedType: string,
): Promise<Result> => {
  const { WARPCAST_ACCESS_TOKEN: accessToken, WARPCAST_BASE_URL: baseUrl } = env

  const body = { feedKey, feedType }

  const { result } = await fetchRequest<Response>(
    baseUrl,
    accessToken,
    HttpRequestMethod.POST,
    '/v2/feed-items',
    {
      json: { ...body },
    },
  )

  return result
}
