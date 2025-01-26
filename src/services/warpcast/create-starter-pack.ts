import { fetchRequest, HttpRequestMethod } from '@/services/warpcast/index'
import { StarterPack } from '@/services/warpcast/types'

interface Result {
  starterPack: StarterPack
}

interface Response {
  result: Result
}

/**
 * Asynchronously creates a new Starter Pack.
 *
 * This function makes a POST request to the `/v2/starter-pack` endpoint to create a new Starter Pack
 * using the given parameters. It utilizes the environment configuration for authentication and
 * base URL.
 * @async
 * @param env - The environment configuration containing the access token and base URL for the API.
 * @param name - The name of the Starter Pack to be created.
 * @param description - A description of the Starter Pack.
 * @param fids - An array of FID (Feature Identifier) numbers associated with the Starter Pack.
 * @param labels - An array of labels associated with the Starter Pack.
 * @returns A promise that resolves to the result of the Starter Pack creation.
 */
export const createStarterPack = async (
  env: Env,
  name: string,
  description: string,
  fids: number[],
  labels: string[],
): Promise<Result> => {
  const { WARPCAST_ACCESS_TOKEN: accessToken, WARPCAST_BASE_URL: baseUrl } = env

  const body = { name, description, fids, labels }

  const { result } = await fetchRequest<Response>(
    baseUrl,
    accessToken,
    HttpRequestMethod.POST,
    '/v2/starter-pack',
    {
      json: body,
    },
  )

  return result
}
