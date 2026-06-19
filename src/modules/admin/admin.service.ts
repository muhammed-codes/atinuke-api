import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Profile, UserRole, UserStatus } from '@prisma/client';
import { PaginatedResult, paginate } from '../../common/pagination/pagination.util';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService, CACHE_KEYS } from '../../core/redis/redis.service';
import { LinkBodyDto } from './dto/link-body.dto';
import { ListUsersDto } from './dto/list-users.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async listUsers(dto: ListUsersDto): Promise<PaginatedResult<Profile>> {
    const where = {
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.role !== undefined && { role: dto.role }),
      ...(dto.keyword && {
        displayName: { contains: dto.keyword, mode: 'insensitive' as const },
      }),
    };

    const [data, totalRecords] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        skip: dto.skip,
        take: dto.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.profile.count({ where }),
    ]);

    return paginate(data, totalRecords);
  }

  async approveUser(id: string): Promise<Profile> {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('User not found');

    const updated = await this.prisma.profile.update({
      where: { id },
      data: { status: UserStatus.APPROVED },
    });

    await this.redis.del(CACHE_KEYS.USER_PROFILE(id));

    return updated;
  }

  async declineUser(id: string): Promise<Profile> {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('User not found');

    const updated = await this.prisma.profile.update({
      where: { id },
      data: { status: UserStatus.DECLINED },
    });

    await this.redis.del(CACHE_KEYS.USER_PROFILE(id));

    return updated;
  }

  async deactivateUser(id: string): Promise<Profile> {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('User not found');

    const updated = await this.prisma.profile.update({
      where: { id },
      data: { status: UserStatus.DEACTIVATED },
    });

    await this.redis.del(CACHE_KEYS.USER_PROFILE(id));

    return updated;
  }

  async promoteToAdmin(id: string): Promise<Profile> {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('User not found');

    if (profile.status !== UserStatus.APPROVED) {
      throw new BadRequestException('User must be approved before being promoted');
    }

    const updated = await this.prisma.profile.update({
      where: { id },
      data: { role: UserRole.ADMIN },
    });

    await this.redis.del(CACHE_KEYS.USER_PROFILE(id));

    return updated;
  }

  async linkBody(id: string, dto: LinkBodyDto): Promise<Profile> {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('User not found');

    const body = await this.prisma.body.findUnique({ where: { id: dto.bodyId } });
    if (!body) throw new NotFoundException('Body not found');

    const alreadyLinked = await this.prisma.profile.findFirst({
      where: { bodyId: dto.bodyId, id: { not: id } },
    });

    if (alreadyLinked) {
      throw new ConflictException('This body is already linked to another user');
    }

    const updated = await this.prisma.profile.update({
      where: { id },
      data: { bodyId: dto.bodyId },
    });

    await this.redis.del(CACHE_KEYS.USER_PROFILE(id));

    return updated;
  }

  async unlinkBody(id: string): Promise<Profile> {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('User not found');

    const updated = await this.prisma.profile.update({
      where: { id },
      data: { bodyId: null },
    });

    await this.redis.del(CACHE_KEYS.USER_PROFILE(id));

    return updated;
  }

  async getDashboardStats() {
    const [
      totalBodies,
      aliveBodies,
      genderStats,
      maritalStats,
      totalUsers,
      userStatusStats,
      recentPendingUsers,
    ] = await Promise.all([
      this.prisma.body.count(),
      this.prisma.body.count({ where: { isAlive: true } }),
      this.prisma.body.groupBy({ by: ['sex'], _count: { sex: true } }),
      this.prisma.body.groupBy({ by: ['maritalStatus'], _count: { maritalStatus: true } }),
      this.prisma.profile.count(),
      this.prisma.profile.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.profile.findMany({
        where: { status: 'PENDING' },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const genderDistribution = {
      MALE: genderStats.find((g) => g.sex === 'MALE')?._count.sex ?? 0,
      FEMALE: genderStats.find((g) => g.sex === 'FEMALE')?._count.sex ?? 0,
    };

    const maritalStatusDistribution = {
      SINGLE: maritalStats.find((m) => m.maritalStatus === 'SINGLE')?._count.maritalStatus ?? 0,
      MARRIED: maritalStats.find((m) => m.maritalStatus === 'MARRIED')?._count.maritalStatus ?? 0,
      DIVORCED: maritalStats.find((m) => m.maritalStatus === 'DIVORCED')?._count.maritalStatus ?? 0,
      WIDOWED: maritalStats.find((m) => m.maritalStatus === 'WIDOWED')?._count.maritalStatus ?? 0,
    };

    const userStatusDistribution = {
      PENDING: userStatusStats.find((u) => u.status === 'PENDING')?._count.status ?? 0,
      APPROVED: userStatusStats.find((u) => u.status === 'APPROVED')?._count.status ?? 0,
      DECLINED: userStatusStats.find((u) => u.status === 'DECLINED')?._count.status ?? 0,
      DEACTIVATED: userStatusStats.find((u) => u.status === 'DEACTIVATED')?._count.status ?? 0,
    };

    return {
      bodies: {
        total: totalBodies,
        alive: aliveBodies,
        deceased: totalBodies - aliveBodies,
      },
      genderDistribution,
      maritalStatusDistribution,
      users: {
        total: totalUsers,
        ...userStatusDistribution,
      },
      recentPendingUsers,
    };
  }
}
