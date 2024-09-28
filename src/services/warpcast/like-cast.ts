import { fetchRequest, HttpRequestMethod } from '@/services/warpcast/index'
import { Like } from '@/services/warpcast/types'

interface Result {
  like: Like
}

interface Response {
  result: Result
}

/**
 * Sends a like cast request to the warpcast server.
 * @param env - The environment configuration.
 * @param castHash - The hash of the cast.
 * @returns - A promise that resolves to a Response object from the server.
 */
export const likeCast = async (env: Env, castHash: string): Promise<Result> => {
  const { WARPCAST_ACCESS_TOKEN: accessToken, WARPCAST_BASE_URL: baseUrl } = env

  const body = { castHash }

  const { result } = await fetchRequest<Response>(
    baseUrl,
    accessToken,
    HttpRequestMethod.PUT,
    '/v2/cast-likes',
    { json: body },
  )

  return result
}
