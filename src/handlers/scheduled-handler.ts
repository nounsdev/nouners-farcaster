import { cacheHandler } from '@/handlers/cache-handler'
import { channelHandler } from '@/handlers/channel-handler'
import { directCastsHandler } from '@/handlers/direct-casts-handler'
import { proposalHandler } from '@/handlers/proposal-handler'
import { logger } from '@/utilities/logger'
import { CronTime } from 'cron-time-generator'

/**
 * Handles scheduled events based on the provided cron schedule.
 * @param controller - The controller containing the cron schedule information.
 * @param env - The environment object that contains configuration and state.
 * @returns A promise that resolves when the handler is done executing.
 */
export async function scheduledHandler(
  controller: ScheduledController,
  env: Env,
) {
  switch (controller.cron) {
    case CronTime.everyHour():
      await cacheHandler(env)
      await channelHandler(env)
      break
    case CronTime.every(12).hours():
      await directCastsHandler(env)
      break
    case CronTime.everyDayAt(14, 0):
      await proposalHandler(env)
      break
    default:
      logger.info({ cron: controller.cron }, 'No handler for the cron schedule')
  }
}
