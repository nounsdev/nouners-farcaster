import { fetchRequest, HttpRequestMethod } from '@/services/warpcast/index'
import { User } from '@/services/warpcast/types'
import type { IntRange } from 'type-fest'

interface Result {
  users: User[]
  cursor?: string
}

interface Response {
  result: Result
}

/**
 * Retrieves users of a specific starter pack.
 * @async
 * @param env - The environment configuration object.
 * @param id - The ID of the starter pack.
 * @param limit - The maximum number of results to retrieve.
 * @returns - A promise that resolves to the list of users.
 */
export const getStarterPackUsers = async (
  env: Env,
  id: string,
  limit: IntRange<0, 101> = 15,
): Promise<Result> => {
  const { WARPCAST_ACCESS_TOKEN: accessToken, WARPCAST_BASE_URL: baseUrl } = env

  const params = { id, limit: limit.toString() }

  const { result } = await fetchRequest<Response>(
    baseUrl,
    accessToken,
    HttpRequestMethod.GET,
    '/v2/starter-pack-users',
    {
      params,
    },
  )

  return result
}
