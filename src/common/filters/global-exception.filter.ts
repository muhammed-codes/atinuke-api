import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../../core/logger/logger.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as { message: string }).message;
    } else if (exception instanceof Error && typeof (exception as any).code === 'string' && (exception as any).code.startsWith('P')) {
      const code = (exception as any).code;
      if (code === 'P2002') {
        statusCode = HttpStatus.CONFLICT;
        const target = ((exception as any).meta?.target as string[])?.join(', ') ?? 'field';
        message = `Unique constraint violation on: ${target}`;
      } else if (code === 'P2025') {
        statusCode = HttpStatus.NOT_FOUND;
        message = 'Record not found';
      } else {
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        message = `Database Error: ${exception.message}`;
      }
    } else if (exception instanceof Error) {
      message =
        process.env.NODE_ENV !== 'production'
          ? exception.message
          : 'An unexpected error occurred';
    }

    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} — ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
        'GlobalExceptionFilter',
      );
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
