import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';

@Injectable()
export class SupabaseJwtGuard extends AuthGuard('jwt') {
  handleRequest<TUser = AuthenticatedUser>(
    err: Error | null,
    user: TUser | false,
    info: any,
  ): TUser {
    if (err) {
      throw err;
    }
    if (!user) {
      console.error('Passport Error Info:', info);
      throw new UnauthorizedException(info?.message || 'Missing or invalid token');
    }
    return user;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
