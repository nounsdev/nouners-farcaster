import { likeCast } from '@/services/warpcast'
import { getCastLikes } from '@/services/warpcast/get-cast-likes'
import { getFeedItems } from '@/services/warpcast/get-feed-items'
import { recast } from '@/services/warpcast/recast'

/**
 * Handles the nouns channel in the given environment.
 * @param env - The environment object.
 * @returns - A promise that resolves with no value.
 */
export async function handleNounsChannel(env: Env) {
  const { KV: kv } = env

  const nounersLikeThreshold = 2
  const farcasterUsers: number[] =
    (await kv.get('nouns-farcaster-users', { type: 'json' })) ?? []

  if (farcasterUsers.length === 0) {
    return
  }

  const { items } = await getFeedItems(env, 'nouns', 'unfiltered')

  for (const item of items) {
    let nounersLikeCount = 0

    if (item.cast.reactions.count <= 0) {
      continue
    }

    const { likes } = await getCastLikes(env, item.cast.hash)

    for (const like of likes) {
      if (farcasterUsers.includes(like.reactor.fid)) {
        nounersLikeCount += 1
      }
    }

    if (nounersLikeCount >= nounersLikeThreshold) {
      await recast(env, item.cast.hash)
      await likeCast(env, item.cast.hash)
    }
  }
}

/**
 * Handles the channel based on the given environment.
 * @param env - The environment object containing channel details.
 * @returns A Promise that resolves when the channel handler has completed execution.
 */
export async function channelHandler(env: Env) {
  await handleNounsChannel(env)
}
