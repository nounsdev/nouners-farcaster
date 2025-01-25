import pino, { Logger } from 'pino'

const logLevel =
  process.env.LOG_LEVEL ??
  (process.env.NODE_ENV === 'development' ? 'debug' : 'info')

export const logger: Logger = pino({
  level: logLevel,
  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  }),
  ...(process.env.NODE_ENV === 'production' && {
    timestamp: pino.stdTimeFunctions.isoTime,
  }),
  serializers: pino.stdSerializers,
})
