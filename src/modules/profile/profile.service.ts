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

  async getMe(userId: string): Promise<Profile> {
    const cached = await this.redis.get<Profile>(CACHE_KEYS.USER_PROFILE(userId));
    if (cached) return cached;

    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    await this.redis.set(CACHE_KEYS.USER_PROFILE(userId), profile, 300);

    return profile;
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
