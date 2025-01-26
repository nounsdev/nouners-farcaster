import { fetchRequest, HttpRequestMethod } from '@/services/warpcast/index'
import { User } from '@/services/warpcast/types'

interface Result {
  user: User
  extras: {
    fid: number
    custodyAddress: string
    ethWallets: string[]
    solanaWallets: string[]
  }
  collectionsOwned: string[]
}

interface Response {
  result: Result
}

/**
 * Fetches a user by their FID (Farcaster ID) from the Warpcast API.
 * @async
 * @param env - The environment object containing API configuration, including `WARPCAST_ACCESS_TOKEN` and `WARPCAST_BASE_URL`.
 * @param fid - The Farcaster ID of the user to retrieve.
 * @returns A promise resolving to the result containing the user data.
 * @throws Will throw an error if the fetch request fails or the API response indicates an error.
 */
export const getUserByFid = async (env: Env, fid: number): Promise<Result> => {
  const { WARPCAST_ACCESS_TOKEN: accessToken, WARPCAST_BASE_URL: baseUrl } = env

  const params = { fid: fid.toString() }

  const { result } = await fetchRequest<Response>(
    baseUrl,
    accessToken,
    HttpRequestMethod.GET,
    `/v2/user-by-fid`,
    { params },
  )

  return result
}
