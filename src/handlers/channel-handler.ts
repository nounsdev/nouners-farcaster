import { getCastLikes } from '@/services/warpcast/get-cast-likes'
import { getFeedItems } from '@/services/warpcast/get-feed-items'
import { getMe } from '@/services/warpcast/get-me'
import { chunk, map, pipe } from 'remeda'

interface ReactionBody {
  type: 'like' | 'recast'
  data: {
    hash: string
  }
}

// eslint-disable-next-line jsdoc/require-returns-check
/**
 * Logs a debug message to the console with optional additional arguments.
 * @param message - The debug message to log.
 * @param args - Additional arguments to include in the log.
 * @returns This function does not return a value.
 */
function logDebug(message: string, ...args: unknown[]): void {
  console.log(`[DEBUG] ${message}`, ...args)
}

/**
 * Fetches noun feed items from the specified environment until the maximum
 * number of items is reached or no more items are available.
 * @param env - The environment from which to fetch the feed items.
 * @returns A promise that resolves to an object containing the fetched items.
 */
async function getNounFeedItems(env: Env) {
  logDebug('Fetching noun feed items')
  const allItems: Awaited<ReturnType<typeof getFeedItems>>['items'] = []
  let fetchedItemsCount = 0
  const maxItems = 300

  let excludeItemIdPrefixes: string[] = []

  while (fetchedItemsCount < maxItems) {
    logDebug(
      'Fetching feed items with excludeItemIdPrefixes:',
      excludeItemIdPrefixes,
    )
    const { items } = await getFeedItems(
      env,
      'nouns',
      'default',
      excludeItemIdPrefixes,
    )

    // Add the new items to the total collection.
    allItems.push(...items)
    fetchedItemsCount += items.length

    if (items.length === 0) {
      // No more items to fetch, exit the loop.
      logDebug('No more items to fetch')
      break
    }

    // Add new prefixes to `excludeItemIdPrefixes` without resetting it.
    const newPrefixes = pipe(
      items,
      map((item) => item.cast.hash.replace(/^0x/, '').slice(0, 8)),
    )
    excludeItemIdPrefixes = excludeItemIdPrefixes.concat(newPrefixes)
  }

  logDebug('Fetched total items:', fetchedItemsCount)
  return { items: allItems }
}

/**
 * Handles the nouns channel in the given environment.
 * @param env - The environment object.
 * @returns - A promise that resolves with no value.
 */
export async function handleNounsChannel(env: Env) {
  logDebug('Handling Nouns channel')
  const { KV: kv, QUEUE: queue } = env

  // Fetch the current user
  logDebug('Fetching current user')
  const { user } = await getMe(env)
  const nounersLikeThreshold = 2

  // Fetch Farcaster user IDs from KV store
  logDebug('Fetching Farcaster user IDs from KV store')
  const farcasterUsers: number[] =
    (await kv.get('nouns-farcaster-users', { type: 'json' })) ?? []
  if (farcasterUsers.length === 0) {
    logDebug('No Farcaster users found')
    return // Exit if no Farcaster users found
  }

  // Fetch Farcaster feed items
  logDebug('Fetching Farcaster feed items')
  const { items } = await getNounFeedItems(env)

  const batch: MessageSendRequest<ReactionBody>[] = []

  // Process each cast item
  for (const item of items) {
    logDebug('Processing cast item:', item.cast.hash)
    let nounersLikeCount = 0

    // Skip if no likes on the item
    if (item.cast.reactions.count <= 0) {
      logDebug('Skipping item with no likes:', item.cast.hash)
      continue
    }

    // Fetch likes for the cast item
    logDebug('Fetching likes for item:', item.cast.hash)
    const { likes } = await getCastLikes(env, item.cast.hash)
    const likerIds = pipe(
      likes,
      map((like) => like.reactor.fid),
    )

    // Skip if the current user already liked the item
    if (likerIds.includes(user.fid)) {
      logDebug('Current user already liked the item:', item.cast.hash)
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
      logDebug(
        'Threshold met, preparing to like and recast item:',
        item.cast.hash,
      )
      batch.push({ body: { type: 'like', data: { hash: item.cast.hash } } })
      batch.push({ body: { type: 'recast', data: { hash: item.cast.hash } } })
    }
  }

  if (batch.length > 0) {
    try {
      const batchSizeLimit = 100

      const chunkedBatches = pipe(batch, chunk(batchSizeLimit))

      for (const chunk of chunkedBatches) {
        await queue.sendBatch(chunk)
        logDebug('Chunk enqueued successfully:', chunk)
      }
    } catch (error) {
      logDebug('Error enqueuing batch:', error)
    }
  }
}

/**
 * Handles the channel based on the given environment.
 * @param env - The environment object containing channel details.
 * @returns A Promise that resolves when the channel handler has completed execution.
 */
export async function channelHandler(env: Env) {
  logDebug('Channel handler started')
  await handleNounsChannel(env)
  logDebug('Channel handler completed')
}
