import * as winston from 'winston';
import { join } from 'path';

export const winstonConfig: winston.LoggerOptions = {
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    new winston.transports.File({
      filename: join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: join(process.cwd(), 'logs', 'combined.log'),
    }),
  ],
};
