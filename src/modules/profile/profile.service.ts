import { Injectable, NotFoundException } from '@nestjs/common';
import { Profile } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService, CACHE_KEYS } from '../../core/redis/redis.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getMe(userId: string) {
    const cached = await this.redis.get<any>(CACHE_KEYS.USER_PROFILE(userId));
    if (cached) return cached;

    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      include: {
        body: {
          include: {
            photos: {
              orderBy: { position: 'asc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    const result = {
      ...profile,
      displayName: profile.displayName || profile.body?.fullname || '',
      profilePhoto: profile.profilePhoto || profile.body?.photos?.[0]?.url || null,
      bio: profile.bio || profile.body?.notes || null,
    };

    await this.redis.set(CACHE_KEYS.USER_PROFILE(userId), result, 300);

    return result;
  }

  async updateMe(userId: string, dto: UpdateProfileDto): Promise<Profile> {
    const updated = await this.prisma.profile.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        phoneNumber: dto.phoneNumber,
        profilePhoto: dto.profilePhoto,
        bio: dto.bio,
      },
    });

    await this.redis.del(CACHE_KEYS.USER_PROFILE(userId));

    return updated;
  }
}
