import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

/**
 * Create a client for interacting with the Ethereum mainnet.
 * @param env - The environment object containing configuration parameters.
 * @returns - The created client.
 */
export function createClient(env: Env) {
  const { ALCHEMY_API_KEY: alchemyApiKey } = env

  return createPublicClient({
    chain: mainnet,
    transport: http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`),
  })
}
