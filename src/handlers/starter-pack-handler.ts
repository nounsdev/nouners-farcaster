import { getMe } from '@/services/warpcast/get-me'
import { getStarterPackUsers } from '@/services/warpcast/get-starter-pack-users'
import { getStarterPacks } from '@/services/warpcast/get-starter-packs'
import { logger } from '@/utilities/logger'
import { filter, flatMap, map, pipe } from 'remeda'

/**
 * @param env Environment configuration for the handler.
 */
export async function starterPackHandler(env: Env) {
  const { user } = await getMe(env)
  logger.debug({ user }, 'user')

  const { starterPacks } = await getStarterPacks(env, user.fid, 100)
  logger.debug({ starterPacks }, 'starter packs')

  const filteredStarterPacks = pipe(
    starterPacks,
    filter((pack) => pack.id.startsWith('Nouns-Radar')),
  )
  logger.debug({ filteredStarterPacks }, 'filtered starter packs')

  const users = await pipe(
    filteredStarterPacks,
    map(async (pack) => {
      const { users } = await getStarterPackUsers(env, pack.id)
      return users // Return users array for this pack
    }),
    async (promises) => {
      const results = await Promise.all(promises) // Resolve all async operations
      return flatMap(results, (users) => users) // Flatten the results into a single array
    },
  )
  logger.debug({ users }, 'all users')
}
