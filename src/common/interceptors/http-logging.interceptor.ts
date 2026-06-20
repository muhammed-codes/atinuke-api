import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Optional,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { LogCategory, LogLevel, LogSource } from '@prisma/client';
import { LoggerService } from '../../core/logger/logger.service';
import { AuthenticatedUser } from '../types/authenticated-user.type';
import { ActivityLogService } from '../../modules/activity-log/activity-log.service';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const ROUTE_META: Record<string, { action: string; category: LogCategory }> = {
  'POST /api/auth/signup':           { action: 'SIGNUP',                category: LogCategory.AUTH },
  'POST /api/auth/login':            { action: 'LOGIN',                 category: LogCategory.AUTH },
  'POST /api/auth/forgot-password':  { action: 'FORGOT_PASSWORD',       category: LogCategory.AUTH },
  'POST /api/auth/change-password':  { action: 'CHANGE_PASSWORD',       category: LogCategory.AUTH },

  'PUT /api/admin/users/:id/approve':    { action: 'APPROVE_USER',     category: LogCategory.ADMIN },
  'PUT /api/admin/users/:id/decline':    { action: 'DECLINE_USER',     category: LogCategory.ADMIN },
  'PUT /api/admin/users/:id/deactivate': { action: 'DEACTIVATE_USER',  category: LogCategory.ADMIN },
  'PUT /api/admin/users/:id/promote':    { action: 'PROMOTE_USER',     category: LogCategory.ADMIN },
  'PUT /api/admin/users/:id/body':       { action: 'LINK_BODY',        category: LogCategory.ADMIN },
  'DELETE /api/admin/users/:id/body':    { action: 'UNLINK_BODY',      category: LogCategory.ADMIN },
  'PUT /api/admin/users/:id':            { action: 'UPDATE_USER',      category: LogCategory.ADMIN },

  'POST /api/body':                      { action: 'CREATE_BODY',      category: LogCategory.BODY },
  'POST /api/body/nuclear-family':       { action: 'CREATE_FAMILY',    category: LogCategory.BODY },
  'PUT /api/body/:id':                   { action: 'UPDATE_BODY',      category: LogCategory.BODY },
  'DELETE /api/body/:id':                { action: 'DELETE_BODY',      category: LogCategory.BODY },
  'POST /api/body/:id/spouse':           { action: 'ADD_SPOUSE',       category: LogCategory.BODY },
  'PUT /api/body/:id/spouse/:sid':       { action: 'UPDATE_SPOUSE',    category: LogCategory.BODY },
  'DELETE /api/body/:id/spouse/:sid':    { action: 'REMOVE_SPOUSE',    category: LogCategory.BODY },

  'PUT /api/auth/me':                    { action: 'UPDATE_PROFILE',   category: LogCategory.PROFILE },

  'POST /api/gallery/albums':            { action: 'CREATE_ALBUM',     category: LogCategory.GALLERY },
  'PATCH /api/gallery/albums/:id':       { action: 'UPDATE_ALBUM',     category: LogCategory.GALLERY },
  'DELETE /api/gallery/albums/:id':      { action: 'DELETE_ALBUM',     category: LogCategory.GALLERY },
  'POST /api/gallery/media':             { action: 'UPLOAD_MEDIA',     category: LogCategory.GALLERY },
  'PATCH /api/gallery/media/:id':        { action: 'UPDATE_MEDIA',     category: LogCategory.GALLERY },
  'DELETE /api/gallery/media/:id':       { action: 'SOFT_DELETE_MEDIA',category: LogCategory.GALLERY },
  'POST /api/gallery/media/:id/restore': { action: 'RESTORE_MEDIA',   category: LogCategory.GALLERY },
  'DELETE /api/gallery/media/:id/permanent': { action: 'PERMANENT_DELETE_MEDIA', category: LogCategory.GALLERY },
};

const matchRoute = (method: string, path: string) => {
  const key = `${method} ${path}`;
  if (ROUTE_META[key]) return ROUTE_META[key];

  for (const [pattern, meta] of Object.entries(ROUTE_META)) {
    const regex = new RegExp(
      '^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$'
    );
    if (regex.test(key)) return meta;
  }

  return null;
};

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: LoggerService,
    @Optional() private readonly activityLogService?: ActivityLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, path, ip } = req;
    const userId = req.user?.id ?? undefined;
    const userDisplay = (req.user as any)?.displayName ?? undefined;
    const userAgent = req.headers['user-agent'];
    const startTime = Date.now();
    const origin = req.headers.origin || req.headers.referer || '';
    let source = LogSource.SYSTEM;
    if (origin.includes('3001') || origin.includes('admin')) {
      source = LogSource.ADMIN;
    } else if (origin.includes('3002') || origin.includes('form') || origin.includes('app')) {
      source = LogSource.APP;
    }

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startTime;
        const statusCode = res.statusCode;

        this.logger.log(`${method} ${path} ${statusCode} ${durationMs}ms`, 'HTTP');

        if (durationMs > 5000) {
          this.logger.security('SLOW_REQUEST', { method, path, durationMs, ip, userId }, 'HTTP');
        }

        if (!MUTATION_METHODS.has(method)) return;

        const meta = matchRoute(method, path);
        if (!meta) return;

        this.activityLogService?.create({
          userId,
          userDisplay,
          action: meta.action,
          category: meta.category,
          source,
          level: LogLevel.INFO,
          method,
          path,
          statusCode,
          durationMs,
          ip,
          userAgent,
        }).catch(() => {});
      }),
      catchError((err) => {
        const durationMs = Date.now() - startTime;
        const statusCode = err?.status ?? 500;

        if (statusCode === 401 || statusCode === 403) {
          this.logger.security('AUTH_ERROR_RESPONSE', {
            method, path, statusCode, durationMs, ip, userId,
            reason: err?.message,
          }, 'HTTP');

          this.activityLogService?.create({
            userId,
            userDisplay,
            action: 'AUTH_FAILURE',
            category: LogCategory.AUTH,
            source,
            level: LogLevel.SECURITY,
            method,
            path,
            statusCode,
            durationMs,
            ip,
            userAgent,
            metadata: { reason: err?.message },
          }).catch(() => {});
        } else if (statusCode >= 500) {
          this.logger.error(`${method} ${path} ${statusCode} ${durationMs}ms`, err?.stack, 'HTTP');

          this.activityLogService?.create({
            userId,
            userDisplay,
            action: 'SERVER_ERROR',
            category: LogCategory.SYSTEM,
            source,
            level: LogLevel.ERROR,
            method,
            path,
            statusCode,
            durationMs,
            ip,
            userAgent,
            metadata: { message: err?.message },
          }).catch(() => {});
        } else {
          this.logger.warn(`${method} ${path} ${statusCode} ${durationMs}ms`, 'HTTP');
        }

        return throwError(() => err);
      }),
    );
  }
}
