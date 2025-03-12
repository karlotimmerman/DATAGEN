import { createLogger, format, transports } from 'winston';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Define log format
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Create the logger
export const logger = createLogger({
  level: level(),
  levels,
  format: logFormat,
  transports: [
    // Write all logs to console
    new transports.Console({
      format: format.combine(
        format.colorize({ all: true }),
        format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message} ${info.stack || ''}`
        )
      ),
    }),

    // Write errors to a file
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: format.combine(format.uncolorize(), logFormat),
    }),

    // Write all logs to a combined file
    new transports.File({
      filename: 'logs/combined.log',
      format: format.combine(format.uncolorize(), logFormat),
    }),
  ],
});

// Log additional info during initialization
logger.info('Logger initialized');

// In production, handle uncaught exceptions and rejections
if (process.env.NODE_ENV === 'production') {
  logger.exceptions.handle(new transports.File({ filename: 'logs/exceptions.log' }));

  logger.rejections.handle(new transports.File({ filename: 'logs/rejections.log' }));
}

type LogMetadata = Record<string, unknown>;

// For use on the client side, we need to export a simplified logger
// eslint-disable-next-line no-console
export const clientLogger = {
  error: (message: string, meta?: LogMetadata) => {
    // eslint-disable-next-line no-console
    console.error(message, meta);
  },
  warn: (message: string, meta?: LogMetadata) => {
    // eslint-disable-next-line no-console
    console.warn(message, meta);
  },
  info: (message: string, meta?: LogMetadata) => {
    // eslint-disable-next-line no-console
    console.info(message, meta);
  },
  debug: (message: string, meta?: LogMetadata) => {
    // eslint-disable-next-line no-console
    console.debug(message, meta);
  },
};
