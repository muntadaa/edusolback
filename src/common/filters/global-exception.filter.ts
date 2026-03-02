import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | string[];
    let error: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = this.getDefaultErrorName(status);
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, any>;
        message = responseObj.message || exception.message;
        error = responseObj.error || this.getDefaultErrorName(status);
      } else {
        message = exception.message;
        error = this.getDefaultErrorName(status);
      }
    } else if (exception instanceof QueryFailedError) {
      // Handle TypeORM database errors
      status = HttpStatus.BAD_REQUEST;
      message = this.handleDatabaseError(exception);
      error = 'Database Error';
      
      // Log the full error for debugging
      this.logger.error('Database Error', {
        context: 'GlobalExceptionFilter',
        message: exception.message,
        stack: exception.stack,
        method: request.method,
        url: request.url,
        statusCode: status,
      });
    } else if (exception instanceof Error) {
      // Handle unexpected errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : exception.message;
      error = 'Internal Server Error';

      // Log unexpected errors
      this.logger.error('Unexpected Error', {
        context: 'GlobalExceptionFilter',
        message: exception.message,
        stack: exception.stack,
        method: request.method,
        url: request.url,
        statusCode: status,
      });
    } else {
      // Handle unknown error types
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      error = 'Internal Server Error';

      this.logger.error('Unknown error type', {
        context: 'GlobalExceptionFilter',
        error: JSON.stringify(exception),
        method: request.method,
        url: request.url,
        statusCode: status,
      });
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error: error || this.getDefaultErrorName(status),
    };

    // Log the error response
    const logLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'debug';
    this.logger[logLevel](`${request.method} ${request.url} - ${status}`, {
      context: 'GlobalExceptionFilter',
      statusCode: status,
      errorResponse,
      ip: request.ip,
      userAgent: request.get('user-agent'),
    });

    response.status(status).json(errorResponse);
  }

  private getDefaultErrorName(statusCode: number): string {
    const errorNames: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      406: 'Not Acceptable',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      501: 'Not Implemented',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    };

    return errorNames[statusCode] || 'Error';
  }

  private handleDatabaseError(exception: QueryFailedError): string {
    const message = exception.message;

    // Handle common database constraint violations
    if (message.includes('Duplicate entry')) {
      const match = message.match(/Duplicate entry '(.+?)' for key/);
      if (match) {
        return `Duplicate entry: ${match[1]} already exists`;
      }
      return 'Duplicate entry: This record already exists';
    }

    if (message.includes('foreign key constraint')) {
      return 'Cannot perform this operation due to a foreign key constraint';
    }

    if (message.includes('cannot be null')) {
      return 'Required field cannot be null';
    }

    // In production, return a generic message
    if (process.env.NODE_ENV === 'production') {
      return 'Database operation failed';
    }

    // In development, return more details
    return message;
  }
}

