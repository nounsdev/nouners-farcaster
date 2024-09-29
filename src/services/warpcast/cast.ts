import { fetchRequest, HttpRequestMethod } from '@/services/warpcast/index'
import { Cast } from '@/services/warpcast/types'

interface Result {
  cast: Cast
}

interface Response {
  result: Result
}

/**
 * Function to create a new cast within the specified environment.
 * @param env - The environment configuration object, containing access tokens and base URLs.
 * @param text - The main content of the cast.
 * @param embeds - An array of embed strings to be included in the cast.
 * @param channelKey - The key for the channel where the cast will be posted.
 * @param [castDistribution] - The distribution scope of the cast.
 *     Defaults to 'channel-only'.
 * @returns - A promise that resolves to the created cast object.
 */
export const cast = async (
  env: Env,
  text: string,
  embeds: string[],
  channelKey: string,
  castDistribution = 'channel-only',
): Promise<Result> => {
  const { WARPCAST_ACCESS_TOKEN: accessToken, WARPCAST_BASE_URL: baseUrl } = env
  const body = { text, embeds, channelKey, castDistribution }

  const { result } = await fetchRequest<Response>(
    baseUrl,
    accessToken,
    HttpRequestMethod.POST,
    '/v2/casts',
    { json: body },
  )

  return result
}
