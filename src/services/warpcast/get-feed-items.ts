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
 * Fetches feed items based on the provided feed key, feed type, and an optional timestamp.
 * @param env - The environment variables required to make the request, including access token and base URL.
 * @param feedKey - The key identifying the feed to be fetched.
 * @param feedType - The type of the feed.
 * @param [olderThan] - Optional timestamp to fetch items older than the specified time.
 * @returns - A promise that resolves to a Result object containing the feed items.
 */
export const getFeedItems = async (
  env: Env,
  feedKey: string,
  feedType: string,
  olderThan?: number,
): Promise<Result> => {
  const { WARPCAST_ACCESS_TOKEN: accessToken, WARPCAST_BASE_URL: baseUrl } = env

  const body = { feedKey, feedType, olderThan }

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
