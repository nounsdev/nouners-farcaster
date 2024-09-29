import { getBlockNumber } from '@/services/ethereum/get-block-number'
import { fetchAccounts } from '@/services/nouns/fetch-accounts'
import { fetchDelegates } from '@/services/nouns/fetch-delegates'
import { fetchVoters } from '@/services/nouns/fetch-voters'
import { getUserByVerification } from '@/services/warpcast/get-user-by-verification'
import { DateTime } from 'luxon'
import { map, pipe, sortBy, unique } from 'remeda'

const expirationTtl = 60 * 60 * 24

/**
 * Retrieves the holder's addresses from the provided environment's KV store.
 * If not found, fetches the accounts and extracts the addresses, then stores them in the KV store.
 * @param env - The environment object containing the KV store and other configurations.
 * @returns A promise that resolves to an array of holder's addresses.
 */
async function fetchHolderAddresses(env: Env) {
  const { KV: kv } = env

  let holdersAddresses: string[] =
    (await kv.get('nouns-holders-addresses', { type: 'json' })) ?? []
  if (holdersAddresses.length === 0) {
    const { accounts } = await fetchAccounts(env)
    holdersAddresses = pipe(
      accounts,
      map((account) => account.id),
    )
    await kv.put('nouns-holders-addresses', JSON.stringify(holdersAddresses), {
      expirationTtl,
    })
  }
  return holdersAddresses
}

/**
 * Retrieves the delegates' addresses from the KV store. If the addresses are not available in the KV store,
 * it fetches the latest delegate addresses, stores them in the KV store, and then returns them.
 * @param env - The environment object containing references to external resources like the KV store.
 * @returns - A promise that resolves to an array of delegate addresses.
 */
async function fetchDelegateAddresses(env: Env) {
  const { KV: kv } = env

  let delegatesAddresses: string[] =
    (await kv.get('nouns-delegates-addresses', { type: 'json' })) ?? []
  if (delegatesAddresses.length === 0) {
    const { delegates } = await fetchDelegates(env)
    delegatesAddresses = pipe(
      delegates,
      map((account) => account.id),
    )
    await kv.put(
      'nouns-delegates-addresses',
      JSON.stringify(delegatesAddresses),
      {
        expirationTtl,
      },
    )
  }
  return delegatesAddresses
}

/**
 * Fetches the Farcaster users associated with holder and delegate addresses
 * and stores them to the given environment's KV storage.
 * @param env - The environment object containing the KV storage and necessary configurations.
 * @returns - A promise that resolves when the fetch and store operation is complete.
 */
async function fetchAndStoreFarcasterUsers(env: Env) {
  const { KV: kv } = env

  const holdersAddresses = await fetchHolderAddresses(env)

  const delegatesAddresses = await fetchDelegateAddresses(env)

  let farcasterUsers: number[] =
    (await kv.get('nouns-farcaster-users', { type: 'json' })) ?? []
  if (farcasterUsers.length === 0) {
    const addresses = pipe(
      [...holdersAddresses, ...delegatesAddresses],
      unique(),
    )

    for (const address of addresses) {
      try {
        const { user } = await getUserByVerification(env, address)
        farcasterUsers = pipe(
          [...farcasterUsers, user.fid],
          unique(),
          sortBy((fid) => fid),
        )
      } catch (error) {
        if (
          error instanceof Error &&
          !error.message.startsWith('No FID has connected')
        ) {
          console.error(`An error occurred: ${error.message}`)
        }
      }
    }

    await kv.put('nouns-farcaster-users', JSON.stringify(farcasterUsers), {
      expirationTtl,
    })
  }
}

/**
 * Fetches Farcaster voters, stores their addresses, and updates the list of Farcaster IDs in a KV store.
 * @param env - The environment object containing the key-value store.
 */
async function fetchAndStoreFarcasterVoters(env: Env) {
  const { KV: kv } = env

  let votersAddresses: string[]
  let farcasterVoters: number[] =
    (await kv.get('nouns-farcaster-voters', { type: 'json' })) ?? []
  if (farcasterVoters.length === 0) {
    const now = DateTime.now()
    const blockTimeInSeconds = 12
    const threeMonthsAgo = now.minus({ months: 3 })
    const secondsInThreeMonths = now.diff(threeMonthsAgo, 'seconds').seconds
    const blocksInThreeMonths = secondsInThreeMonths / blockTimeInSeconds

    const startBlock = (await getBlockNumber(env)) - blocksInThreeMonths
    const { voters } = await fetchVoters(env, startBlock)
    votersAddresses = pipe(
      voters,
      map((voter) => voter.id),
    )

    for (const address of votersAddresses) {
      try {
        const { user } = await getUserByVerification(env, address)
        farcasterVoters = pipe(
          [...farcasterVoters, user.fid],
          unique(),
          sortBy((fid) => fid),
        )
      } catch (error) {
        if (
          error instanceof Error &&
          !error.message.startsWith('No FID has connected')
        ) {
          console.error(`An error occurred: ${error.message}`)
        }
      }
    }

    await kv.put('nouns-farcaster-voters', JSON.stringify(farcasterVoters), {
      expirationTtl,
    })
  }
}

/**
 * Handles caching of data for Nouns application.
 * @param env - The environment object containing KV storage.
 * @returns - A promise that resolves when caching is complete.
 */
export async function cacheHandler(env: Env) {
  await fetchAndStoreFarcasterUsers(env)
  await fetchAndStoreFarcasterVoters(env)
}
