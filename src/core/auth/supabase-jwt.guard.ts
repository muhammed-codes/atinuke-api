import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class SupabaseJwtGuard extends AuthGuard('jwt') {
  constructor(private readonly logger: LoggerService) {
    super();
  }

  handleRequest<TUser = AuthenticatedUser>(
    err: Error | null,
    user: TUser | false,
    info: any,
    context: ExecutionContext,
  ): TUser {
    if (err) {
      throw err;
    }
    if (!user) {
      const req = context.switchToHttp().getRequest();
      this.logger.security('JWT_AUTH_FAILED', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        reason: info?.message ?? 'Missing or invalid token',
      }, 'SupabaseJwtGuard');
      throw new UnauthorizedException(info?.message || 'Missing or invalid token');
    }
    return user;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
