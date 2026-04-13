import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import { join } from 'path';

const logDir = process.env.LOG_DIR || join(process.cwd(), 'logs');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
    const contextStr = context ? `[${context}]` : '';
    const traceStr = trace ? `\n${trace}` : '';
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level} ${contextStr} ${message}${metaStr}${traceStr}`;
  }),
);

export const winstonConfig: WinstonModuleOptions = {
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      format: consoleFormat,
    }),

    // File transport for errors
    new winston.transports.File({
      filename: join(logDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: join(logDir, 'combined.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],

  // Global options
  exceptionHandlers: [
    new winston.transports.File({
      filename: join(logDir, 'exceptions.log'),
      format: logFormat,
    }),
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: join(logDir, 'rejections.log'),
      format: logFormat,
    }),
  ],
};

