import pino from 'pino';

/**
 * Create logger instance
 */
export const createLogger = (name: string) => {
  return pino({
    name,
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              ignore: 'pid,hostname',
              translateTime: 'SYS:standard',
            },
          }
        : undefined,
  });
};

/**
 * Default logger
 */
export const logger = createLogger('autovid');
