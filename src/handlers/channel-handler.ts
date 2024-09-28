import { getCastLikes } from '@/services/warpcast/get-cast-likes'
import { getFeedItems } from '@/services/warpcast/get-feed-items'
import { getMe } from '@/services/warpcast/get-me'
import { map, pipe } from 'remeda'

interface ReactionBody {
  type: 'like' | 'recast'
  data: {
    hash: string
  }
}

/**
 * Handles the nouns channel in the given environment.
 * @param env - The environment object.
 * @returns - A promise that resolves with no value.
 */
export async function handleNounsChannel(env: Env) {
  // Destructure KV from the environment
  const { KV: kv, QUEUE: queue } = env

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
  const { items } = await getFeedItems(env, 'nouns', 'unfiltered')

  const batch: MessageSendRequest<ReactionBody>[] = []

  // Process each cast item
  for (const item of items) {
    let nounersLikeCount = 0

    // Skip if no likes on the item
    if (item.cast.reactions.count <= 0) {
      continue
    }

    // Fetch likes for the cast item
    const { likes } = await getCastLikes(env, item.cast.hash)
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
      batch.push({ body: { type: 'like', data: { hash: item.cast.hash } } })
      batch.push({ body: { type: 'recast', data: { hash: item.cast.hash } } })
    }
  }

  if (batch.length > 0) {
    try {
      await queue.sendBatch(batch)
      console.log('Batch enqueued successfully:', batch)
    } catch (error) {
      console.error('Error enqueuing batch:', error)
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
