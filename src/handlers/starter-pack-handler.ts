import { getMe } from '@/services/warpcast/get-me'
import { getStarterPacks } from '@/services/warpcast/get-starter-packs'
import { updateStarterPack } from '@/services/warpcast/update-starter-pack'
import { logger } from '@/utilities/logger'
import { filter, first, pipe } from 'remeda'

/**
 * @param env Environment configuration for the handler.
 */
export async function starterPackHandler(env: Env) {
  const { KV: kv } = env
  const farcasterVoterKey = 'nouns-farcaster-voters'

  const farcasterVoters =
    (await kv.get<number[] | null>(farcasterVoterKey, { type: 'json' })) ?? []

  const { user } = await getMe(env)
  logger.debug({ user }, 'user')

  const { starterPacks } = await getStarterPacks(env, user.fid, 100)

  const firstStarterPack = pipe(
    starterPacks,
    filter((pack) => pack.id.startsWith('Nouns-Radar')),
    first(),
  )

  if (!firstStarterPack) {
    logger.warn('No matching starter pack found')
    return
  }

  const { success } = await updateStarterPack(
    env,
    firstStarterPack.id,
    firstStarterPack.name,
    firstStarterPack.description,
    [...farcasterVoters, user.fid],
    firstStarterPack.labels,
  )
}
