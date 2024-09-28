import { getBlockNumber } from '@/services/ethereum/get-block-number'
import { fetchAccounts } from '@/services/nouns/fetch-accounts'
import { fetchDelegates } from '@/services/nouns/fetch-delegates'
import { fetchVoters } from '@/services/nouns/fetch-voters'
import { getUserByVerification } from '@/services/warpcast/get-user-by-verification'
import { DateTime } from 'luxon'
import { map, pipe, sortBy, unique } from 'remeda'

/**
 * Handles caching of data for Nouns application.
 * @param env - The environment object containing KV storage.
 * @returns - A promise that resolves when caching is complete.
 */
export async function cacheHandler(env: Env) {
  const { KV: kv } = env
  const expirationTtl = 60 * 60 * 24

  let holdersAddresses: string[] =
    (await kv.get('nouns-holders-addresses', { type: 'json' })) ?? []
  if (holdersAddresses.length === 0) {
    const { accounts } = await fetchAccounts(env)
    holdersAddresses = pipe(
      accounts,
      map((account) => account.id),
    )
    await kv.put(
      'nouns-holders-addresses',
      JSON.stringify(holdersAddresses),
      {
        expirationTtl,
      },
    )
  }

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
