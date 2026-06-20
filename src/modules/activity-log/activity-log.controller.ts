import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { SupabaseJwtGuard } from '../../core/auth/supabase-jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { ActivityLogService } from './activity-log.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { QueryActivityLogsDto } from './dto/query-activity-logs.dto';

@ApiTags('Activity Logs')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard)
@Controller('activity-logs')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Post('client')
  @ApiOperation({ summary: 'Ingest a client-side activity event (any approved user)' })
  ingestClientLog(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateActivityLogDto,
  ) {
    return this.activityLogService.create({
      ...dto,
      userId: user.id,
    });
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Query activity logs (Admin only)' })
  queryLogs(@Query() filters: QueryActivityLogsDto) {
    return this.activityLogService.query(filters);
  }
}
