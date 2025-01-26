import { fetchRequest, HttpRequestMethod } from '@/services/warpcast/index'
import { StarterPack } from '@/services/warpcast/types'

interface Result {
  starterPack: StarterPack
}

interface Response {
  result: Result
}

/**
 * Retrieves details of a specific starter pack.
 * @async
 * @param env - The environment configuration object.
 * @param id - The ID of the starter pack.
 * @returns - A promise that resolves to the starter pack details.
 */
export const getStarterPack = async (env: Env, id: string): Promise<Result> => {
  const { WARPCAST_ACCESS_TOKEN: accessToken, WARPCAST_BASE_URL: baseUrl } = env

  const params = { id }

  const { result } = await fetchRequest<Response>(
    baseUrl,
    accessToken,
    HttpRequestMethod.GET,
    '/v2/starter-pack',
    {
      params,
    },
  )

  return result
}
