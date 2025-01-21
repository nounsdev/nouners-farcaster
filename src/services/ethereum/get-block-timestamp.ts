import { getBlockNumber } from '@/services/ethereum/get-block-number'
import { createClient } from '@/services/ethereum/index'

/**
 * Retrieves the timestamp of a specific block.
 * @param env - The environment configuration.
 * @param [blockNumber] -
 * The number of the block to retrieve the timestamp for.
 * If not provided, it retrieves the timestamp of the latest block.
 * @returns - The timestamp of the block in number format.
 */
export async function getBlockTimestamp(
  env: Env,
  blockNumber?: number,
): Promise<number> {
  const publicClient = createClient(env)
  const currentBlockNumber = await getBlockNumber(env)
  const fetchingBlockNumber =
    blockNumber && blockNumber > currentBlockNumber
      ? currentBlockNumber
      : blockNumber
  const blockNumberToFetch = BigInt(fetchingBlockNumber ?? currentBlockNumber)
  const approximateBlockTime = 12

  const block = await publicClient.getBlock({ blockNumber: blockNumberToFetch })

  if (blockNumber && blockNumber > currentBlockNumber) {
    return (
      Number(block.timestamp) +
      (blockNumber - currentBlockNumber) * approximateBlockTime
    )
  }

  return Number(block.timestamp)
}
