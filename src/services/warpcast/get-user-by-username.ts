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
 * Retrieves user information based on the provided username.
 * @param env - The environment object containing necessary configuration values.
 * @param username - The username for which the user information is to be fetched.
 * @returns A promise that resolves to the result containing user information.
 */
export const getUserByUsername = async (
  env: Env,
  username: string,
): Promise<Result> => {
  const { WARPCAST_ACCESS_TOKEN: accessToken, WARPCAST_BASE_URL: baseUrl } = env

  const params = { username }

  const { result } = await fetchRequest<Response>(
    baseUrl,
    accessToken,
    HttpRequestMethod.GET,
    `/v2/user-by-username`,
    { params },
  )

  return result
}
