import { getBlockNumber } from '@/services/ethereum/get-block-number'
import { getBlockTimestamp } from '@/services/ethereum/get-block-timestamp'
import { getProposals } from '@/services/nouns/get-proposals'
import { getMe } from '@/services/warpcast/get-me'
import { getUserByVerification } from '@/services/warpcast/get-user-by-verification'
import { logger } from '@/utilities/logger'
import { DateTime } from 'luxon'
import { createHash } from 'node:crypto'
import { filter, isTruthy } from 'remeda'

interface DirectCastBody {
  type: 'direct-cast'
  data: {
    recipientFid: number
    message: string
    idempotencyKey: string
  }
}

/**
 * Converts a given timestamp to a relative time string.
 * @param timestamp - The timestamp to be converted.
 * @returns A relative time string.
 */
function toRelativeTime(timestamp: number): string {
  return DateTime.fromSeconds(timestamp).toRelative({
    style: 'long',
    unit: ['hours', 'minutes'],
  })
}

/**
 * Handles the proposal by retrieving or fetching delegates from KV store and logging them.
 * @param env - The environment object.
 * @returns - A promise that resolves once the proposal is handled.
 */
export async function proposalHandler(env: Env) {
  const { KV: kv, QUEUE: queue } = env

  logger.info('Fetching current user data...')
  const { user } = await getMe(env)

  logger.info('Fetching Farcaster users and subscribers from KV...')
  const farcasterUsers =
    (await kv.get<number[] | null>('nouns-farcaster-users', {
      type: 'json',
    })) ?? []
  const farcasterSubscribers =
    (await kv.get<number[] | null>('nouns-farcaster-subscribers', {
      type: 'json',
    })) ?? []

  logger.info(
    {
      farcasterUsersCount: farcasterUsers.length,
      farcasterSubscribersCount: farcasterSubscribers.length,
    },
    'Fetched Farcaster users and subscribers.',
  )

  logger.info('Fetching current block number...')
  const blockNumber = await getBlockNumber(env)

  logger.info('Fetching active proposals...')
  let { proposals } = await getProposals(env)

  proposals = filter(
    proposals,
    (proposal) =>
      proposal.status === 'ACTIVE' && Number(proposal.endBlock) > blockNumber,
  )

  logger.info(
    { activeProposalsCount: proposals.length },
    'Filtered active proposals.',
  )

  const batch: MessageSendRequest<DirectCastBody>[] = []

  for (const proposal of proposals) {
    const { votes, endBlock, startBlock, id } = proposal

    logger.debug({ proposalId: id }, 'Fetching timestamps for proposal blocks.')
    const [startBlockTimestamp, endBlockTimestamp] = await Promise.all([
      getBlockTimestamp(env, Number(startBlock)),
      getBlockTimestamp(env, Number(endBlock)),
    ])

    const proposalStart = toRelativeTime(startBlockTimestamp)
    const proposalEnd = toRelativeTime(endBlockTimestamp)

    logger.debug(
      { proposalId: id, start: proposalStart, end: proposalEnd },
      'Processed proposal timeframes.',
    )

    const voters = await Promise.all(
      votes.map(async (vote) => {
        try {
          const { user } = await getUserByVerification(
            env,
            vote.voter.id.toLowerCase(),
          )
          return user.fid
        } catch (error) {
          if (
            error instanceof Error &&
            !error.message.startsWith('No FID has connected')
          ) {
            logger.error(
              { error, voterId: vote.voter.id },
              'Error fetching Farcaster user for voter.',
            )
          }
          return null
        }
      }),
    ).then((results) => filter(results, isTruthy))

    logger.info(
      { votersCount: voters.length, proposalId: id },
      'Fetched and filtered voters for the proposal.',
    )

    const message =
      "🗳️ It's voting time, Lil Nouns fam! Proposal #" +
      id.toString() +
      ' is live and ready for your voice. ' +
      'Voting started ' +
      proposalStart +
      ' and wraps up ' +
      proposalEnd +
      '. ' +
      "You received this message because you haven't voted yet. Don't miss out, cast your vote now! 🌟"
    const idempotencyKey = createHash('sha256').update(message).digest('hex')

    for (const recipientFid of farcasterSubscribers) {
      if (
        recipientFid === user.fid ||
        voters.includes(recipientFid) ||
        !farcasterUsers.includes(recipientFid)
      ) {
        logger.debug(
          { fid: recipientFid },
          'Skipping user as they have already voted or are the current user.',
        )
        continue
      }

      const task: MessageSendRequest<DirectCastBody> = {
        body: {
          type: 'direct-cast',
          data: {
            recipientFid,
            message,
            idempotencyKey,
          },
        },
      }

      batch.push(task)
    }
  }

  if (batch.length > 0) {
    logger.info(
      { batchSize: batch.length },
      'Sending message batch to the queue...',
    )
    try {
      await queue.sendBatch(batch)
      logger.info({ batchSize: batch.length }, 'Batch enqueued successfully.')
    } catch (error) {
      logger.error({ error, batch }, 'Error enqueuing message batch.')
    }
  } else {
    logger.debug('No messages to send at this time.')
  }
}
