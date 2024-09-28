import { likeCast } from '@/services/warpcast'
import { recast } from '@/services/warpcast/recast'

interface ReactionBody {
  type: 'like' | 'recast'
  data: {
    hash: string
  }
}

/**
 * A function to calculate the exponential backoff delay.
 * @param attempts - The number of attempts or retries that have been made.
 * @param baseDelaySeconds - The base delay in seconds for the initial attempt.
 * @returns The calculated delay in seconds based on the number of attempts.
 */
const calculateExponentialBackoff = (
  attempts: number,
  baseDelaySeconds: number,
) => {
  return baseDelaySeconds ** attempts
}

/**
 * Handles the "like" reaction task for a given cast.
 * @param env - The environment configuration object.
 * @param data - The data associated with the reaction, containing the hash of the cast.
 * @returns A Promise that resolves when the "like" reaction has been processed successfully, or rejects with an error.
 */
async function handleLikeTask(env: Env, data: ReactionBody['data']) {
  const { hash } = data

  try {
    const result = await likeCast(env, hash)

    console.log(`Like applied successfully to cast:`, result)
  } catch (error) {
    console.error(`Failed to apply like to cast ${hash}:`, error)
    throw error
  }
}

/**
 * Handles the task of recasting by applying a reaction to a specific cast.
 * @param env - The environment configuration that contains necessary settings and credentials.
 * @param data - The data object which includes details about the reaction to be applied, specifically the hash of the cast.
 * @returns - A promise that resolves when the reaction is successfully applied or rejects with an error if it fails.
 */
async function handleRecastTask(env: Env, data: ReactionBody['data']) {
  const { hash } = data

  try {
    const result = await recast(env, hash)

    console.log(`Recast applied successfully to cast:`, result)
  } catch (error) {
    console.error(`Failed to apply recast to cast ${hash}:`, error)
    throw error
  }
}

/**
 * Processes a message and handles tasks based on its type.
 * @param env - The environment configuration object used for task handling.
 * @param message - The message object containing the type and data to be processed.
 * @returns A promise that resolves when the message processing is complete.
 */
async function processMessage(env: Env, message: Message) {
  // @ts-expect-error: A message body type might not have a clear structure
  const { type, data } = message.body

  switch (type) {
    case 'like':
      await handleLikeTask(env, data as ReactionBody['data'])
      break
    case 'recast':
      await handleRecastTask(env, data as ReactionBody['data'])
      break

    default:
      console.error('Unknown task type:', type)
  }
}

/**
 * Handles incoming messages in a queue and processes them based on their
 * message type, with acknowledgment and retry logic.
 * @param batch - The batch of messages to process.
 * @param env - The environment context for the handler.
 * @param _ctx - The execution context for managing async operations.
 * @returns A promise that resolves when all messages in the batch have been
 *   processed and acknowledged.
 */
export async function queueHandler(
  batch: MessageBatch,
  env: Env,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _ctx: ExecutionContext,
) {
  for (const message of batch.messages) {
    try {
      await processMessage(env, message)

      // Acknowledge the message after successful processing
      message.ack()
    } catch (error) {
      console.error('Error processing message, will retry:', error)

      // Retry the message in case of failure
      message.retry({
        delaySeconds: calculateExponentialBackoff(message.attempts, 10),
      })
    }
  }
}
