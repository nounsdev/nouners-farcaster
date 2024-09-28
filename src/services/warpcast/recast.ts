import { fetchRequest, HttpRequestMethod } from '@/services/warpcast/index'

interface Result {
  recast: {
    castHash: string
  }
}
interface Response {
  result: Result
}

/**
 * Sends a recast request to the warpcast server.
 * @param env - The environment configuration.
 * @param castHash - The hash of the cast.
 * @returns - A promise that resolves to a Response object from the server.
 */
export const recast = async (env: Env, castHash: string): Promise<Result> => {
  const { WARPCAST_ACCESS_TOKEN: accessToken, WARPCAST_BASE_URL: baseUrl } = env
  const body = { castHash }
  const { result } = await fetchRequest<Response>(
    baseUrl,
    accessToken,
    HttpRequestMethod.PUT,
    '/v2/recasts',
    { json: body },
  )
  return result
}
