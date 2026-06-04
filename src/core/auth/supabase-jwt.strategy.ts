import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { CACHE_KEYS } from '../redis/redis.service';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';

interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
}

@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
  ) {
    const supabaseUrl = configService.get<string>('SUPABASE_URL')!;
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      }),
      algorithms: ['ES256'],
      issuer: `${supabaseUrl}/auth/v1`,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const userId = payload.sub;

    const cached = await this.redisService.get<AuthenticatedUser>(CACHE_KEYS.USER_PROFILE(userId));
    if (cached) {
      return cached;
    }

    const profile = await this.prismaService.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      throw new UnauthorizedException('User profile not found');
    }

    if (profile.status !== UserStatus.APPROVED) {
      throw new ForbiddenException('Account is pending or declined');
    }

    const user: AuthenticatedUser = {
      id: profile.id,
      role: profile.role,
      status: profile.status,
      bodyId: profile.bodyId,
    };

    await this.redisService.set(CACHE_KEYS.USER_PROFILE(userId), user, 300);

    return user;
  }
}
