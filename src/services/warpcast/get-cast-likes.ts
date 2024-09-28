import { fetchRequest, HttpRequestMethod } from '@/services/warpcast/index'
import { Like } from '@/services/warpcast/types'
import type { NonNegative } from 'type-fest'

interface Result {
  likes: Like[]
  cursor?: string
}

interface Response {
  result: Result
}

/**
 * Retrieves the likes for a given cast.
 * @async
 * @param env - The environment configuration object.
 * @param castHash - The hash of the cast.
 * @param [cursor] - The cursor for pagination.
 * @param [limit] - The limit of results per page.
 * @returns - A promise that resolves to the response of the request.
 */
export const getCastLikes = async (
  env: Env,
  castHash: string,
  cursor?: string,
  limit: NonNegative<number> = 25,
): Promise<Result> => {
  const { WARPCAST_ACCESS_TOKEN: accessToken, WARPCAST_BASE_URL: baseUrl } = env

  const params = { castHash, cursor: cursor ?? '', limit: limit.toString() }

  const { result } = await fetchRequest<Response>(
    baseUrl,
    accessToken,
    HttpRequestMethod.GET,
    '/v2/cast-likes',
    {
      params: params,
    },
  )

  return result
}
