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
}
