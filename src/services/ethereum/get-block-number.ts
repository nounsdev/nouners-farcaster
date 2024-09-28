import { createClient } from '@/services/ethereum/index'

/**
 * Retrieves the current block number from the public client.
 * @param env - The environment for creating the public client.
 * @returns A promise that resolves to the current block number.
 */
export async function getBlockNumber(env: Env) {
  const publicClient = createClient(env)

  return Number(await publicClient.getBlockNumber())
}
