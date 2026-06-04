import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { CACHE_KEYS, RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';

interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
}

@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly JWKS: ReturnType<typeof createRemoteJWKSet>;
  private readonly issuer: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
  ) {
    const supabaseUrl = configService.get<string>('SUPABASE_URL')!;
    const jwksUri = `${supabaseUrl}/auth/v1/.well-known/jwks.json`;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'placeholder',
      algorithms: ['ES256'],
    });

    this.JWKS = createRemoteJWKSet(new URL(jwksUri));
    this.issuer = `${supabaseUrl}/auth/v1`;
  }

  async authenticate(req: Parameters<Strategy['authenticate']>[0], options?: object) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) {
      return this.fail({ message: 'No token provided' }, 401);
    }

    try {
      const { payload } = await jwtVerify(token, this.JWKS, {
        algorithms: ['ES256'],
        issuer: this.issuer,
      });

      const user = await this.validate(payload as JwtPayload);
      this.success(user);
    } catch (err) {
      this.fail({ message: err instanceof Error ? err.message : 'Unauthorized' }, 401);
    }
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
