import { fetchFarcasterFeed } from '@/services/neynar'
import { likeCast } from '@/services/warpcast'
import { getCastLikes } from '@/services/warpcast/get-cast-likes'
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

  const { casts: items } = await fetchFarcasterFeed(env)
  console.log(items.length)

  for (const item of items) {
    let nounersLikeCount = 0

    if (item.reactions.likes_count <= 0) {
      continue
    }

    const { likes } = await getCastLikes(env, item.hash)

    for (const like of likes) {
      if (farcasterUsers.includes(like.reactor.fid)) {
        nounersLikeCount += 1
      }
    }
    console.log(nounersLikeCount)

    if (nounersLikeCount >= nounersLikeThreshold) {
      await recast(env, item.hash)
      await likeCast(env, item.hash)
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
