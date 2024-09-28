import { fetchRequest, HttpRequestMethod } from '@/services/warpcast/index'
import { User } from '@/services/warpcast/types'

interface Result {
  user: User
}

interface Response {
  result: Result
}

export const getMe = async (env: Env): Promise<Result> => {
  const { WARPCAST_ACCESS_TOKEN: accessToken, WARPCAST_BASE_URL: baseUrl } = env

  const { result } = await fetchRequest<Response>(
    baseUrl,
    accessToken,
    HttpRequestMethod.GET,
    '/v2/me',
    {},
  )

  return result
}
