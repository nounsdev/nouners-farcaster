import { fetchFarcasterFeed } from '@/services/neynar'
import { likeCast } from '@/services/warpcast'
import { getCastLikes } from '@/services/warpcast/get-cast-likes'
import { getMe } from '@/services/warpcast/get-me'
import { recast } from '@/services/warpcast/recast'
import { map, pipe } from 'remeda'

/**
 * Handles the nouns channel in the given environment.
 * @param env - The environment object.
 * @returns - A promise that resolves with no value.
 */
export async function handleNounsChannel(env: Env) {
  // Destructure KV from the environment
  const { KV: kv } = env

  // Fetch the current user
  const { user } = await getMe(env)
  const nounersLikeThreshold = 2

  // Fetch Farcaster user IDs from KV store
  const farcasterUsers: number[] =
    (await kv.get('nouns-farcaster-users', { type: 'json' })) ?? []
  if (farcasterUsers.length === 0) {
    return // Exit if no Farcaster users found
  }

  // Fetch Farcaster feed items
  const { casts: items } = await fetchFarcasterFeed(env)

  // Process each cast item
  for (const item of items) {
    let nounersLikeCount = 0

    // Skip if no likes on the item
    if (item.reactions.likes_count <= 0) {
      continue
    }

    // Fetch likes for the cast item
    const { likes } = await getCastLikes(env, item.hash)
    const likerIds = pipe(
      likes,
      map((like) => like.reactor.fid),
    )

    // Skip if the current user already liked the item
    if (likerIds.includes(user.fid)) {
      continue
    }

    // Count likes from Farcaster users
    for (const likerId of likerIds) {
      if (farcasterUsers.includes(likerId)) {
        nounersLikeCount += 1
      }
    }

    // Recast and like the item if threshold is met
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
