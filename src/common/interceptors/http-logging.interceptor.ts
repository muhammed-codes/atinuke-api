import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { LoggerService } from '../../core/logger/logger.service';
import { AuthenticatedUser } from '../types/authenticated-user.type';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, path, ip } = req;
    const userId = req.user?.id ?? 'anonymous';
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startTime;
        const statusCode = res.statusCode;

        this.logger.log(
          `${method} ${path} ${statusCode} ${durationMs}ms`,
          'HTTP',
        );

        if (durationMs > 5000) {
          this.logger.security('SLOW_REQUEST', { method, path, durationMs, ip, userId }, 'HTTP');
        }
      }),
      catchError((err) => {
        const durationMs = Date.now() - startTime;
        const statusCode = err?.status ?? 500;

        if (statusCode === 401 || statusCode === 403) {
          this.logger.security('AUTH_ERROR_RESPONSE', {
            method,
            path,
            statusCode,
            durationMs,
            ip,
            userId,
            reason: err?.message,
          }, 'HTTP');
        } else if (statusCode >= 500) {
          this.logger.error(
            `${method} ${path} ${statusCode} ${durationMs}ms`,
            err?.stack,
            'HTTP',
          );
        } else {
          this.logger.warn(`${method} ${path} ${statusCode} ${durationMs}ms`, 'HTTP');
        }

        return throwError(() => err);
      }),
    );
  }
}
