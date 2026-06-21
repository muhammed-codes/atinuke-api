import { Injectable, Logger } from '@nestjs/common';
import { LogCategory, LogLevel, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { QueryActivityLogsDto } from './dto/query-activity-logs.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleAutoClearLogs() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      const result = await this.prisma.activityLog.deleteMany({
        where: {
          createdAt: {
            lt: sevenDaysAgo,
          },
        },
      });
      this.logger.log(`Auto-cleared ${result.count} old activity logs (older than 7 days)`);
    } catch (error) {
      this.logger.error('Failed to auto-clear activity logs', error);
    }
  }

  async create(dto: CreateActivityLogDto) {
    let userDisplay = dto.userDisplay;

    if (dto.userId && !userDisplay) {
      const profile = await this.prisma.profile.findUnique({
        where: { id: dto.userId },
        select: { displayName: true },
      });
      if (profile) {
        userDisplay = profile.displayName;
      }
    }

    return this.prisma.activityLog.create({ 
      data: {
        ...dto,
        userDisplay,
        metadata: dto.metadata as Prisma.InputJsonValue | undefined
      } 
    });
  }

  async query(filters: QueryActivityLogsDto) {
    const { skip = 0, take = 50, category, level, source, userId, search, from, to } = filters;

    const where: Prisma.ActivityLogWhereInput = {};

    if (category) where.category = category;
    if (level) where.level = level;
    if (source) where.source = source;
    if (userId) where.userId = userId;

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { userDisplay: { contains: search, mode: 'insensitive' } },
        { path: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [totalRecords, data] = await Promise.all([
      this.prisma.activityLog.count({ where }),
      this.prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return { totalRecords, data };
  }

  getCategories() {
    return Object.values(LogCategory);
  }

  getLevels() {
    return Object.values(LogLevel);
  }
}
