import { fetchRequest, HttpRequestMethod } from '@/services/warpcast/index'
import { StarterPack } from '@/services/warpcast/types'
import type { IntRange } from 'type-fest'

interface Result {
  starterPacks: StarterPack[]
  cursor?: string
}

interface Response {
  result: Result
}

/**
 * Fetches starter packs data for a given FID (farcaster ID) from the Warpcast API.
 *
 * This function interacts with the Warpcast API to retrieve a list of users associated with a specified starter pack.
 * It requires environment configuration values such as the API's base URL and access token.
 * @param env - The environment configuration containing necessary API credentials.
 * @param fid - The Farcaster ID for which the starter pack users are to be retrieved.
 * @param [limit] - The maximum number of users to retrieve, defaulted to 15. Must be a non-negative value.
 * @returns - A promise that resolves to the result containing the starter packs data.
 */
export const getStarterPacks = async (
  env: Env,
  fid: number,
  limit: IntRange<0, 101> = 15,
): Promise<Result> => {
  const { WARPCAST_ACCESS_TOKEN: accessToken, WARPCAST_BASE_URL: baseUrl } = env

  const params = { fid: fid.toString(), limit: limit.toString() }

  const { result } = await fetchRequest<Response>(
    baseUrl,
    accessToken,
    HttpRequestMethod.GET,
    '/v2/starter-packs',
    {
      params,
    },
  )

  return result
}
