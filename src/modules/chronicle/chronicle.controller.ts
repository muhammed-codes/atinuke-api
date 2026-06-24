import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { ChronicleService } from './chronicle.service';
import { CreateChronicleDto } from './dto/create-chronicle.dto';
import { UpdateChronicleDto } from './dto/update-chronicle.dto';
import { ChroniclePageDto } from './dto/chronicle-page.dto';
import { ReviewChronicleDto } from './dto/review-chronicle.dto';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { SupabaseJwtGuard } from '../../core/auth/supabase-jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { UserRole, ChronicleStatus } from '@prisma/client';

@ApiTags('Chronicle')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard)
@Controller('chronicle')
export class ChronicleController {
  constructor(private readonly chronicleService: ChronicleService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new chronicle' })
  @ApiResponse({ status: 201, description: 'Chronicle submitted' })
  async submitChronicle(
    @Body() dto: CreateChronicleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chronicleService.submitChronicle(dto, user.id);
  }

  @Post('admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin creates a chronicle directly, published immediately' })
  @ApiResponse({ status: 201, description: 'Chronicle created' })
  async createByAdmin(
    @Body() dto: CreateChronicleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chronicleService.createByAdmin(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Paginated list of published chronicles' })
  @ApiResponse({ status: 200, description: 'List of chronicles' })
  async findAll(
    @Query() dto: ChroniclePageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (user.role !== UserRole.ADMIN && dto.status && dto.status !== ChronicleStatus.PUBLISHED) {
      throw new ForbiddenException('Members can only query published chronicles');
    }
    return this.chronicleService.findAll(dto);
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Pending review queue' })
  @ApiResponse({ status: 200, description: 'List of pending chronicles' })
  async findPendingQueue(@Query() dto: PaginationDto) {
    return this.chronicleService.findPendingQueue(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full chronicle detail' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Chronicle detail' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chronicleService.findById(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Submit an edit to an existing published chronicle' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Edit submitted' })
  async submitEdit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChronicleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chronicleService.submitEdit(id, dto, user);
  }

  @Put(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve pending chronicle or edit' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Chronicle approved' })
  async approveChronicle(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chronicleService.approveChronicle(id, user.id);
  }

  @Put(':id/decline')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Decline pending chronicle or edit' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Chronicle declined' })
  async declineChronicle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewChronicleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chronicleService.declineChronicle(id, dto, user.id);
  }

  @Put(':id/pin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Pin/unpin a published chronicle' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: { type: 'object', properties: { pinned: { type: 'boolean' } } } })
  @ApiResponse({ status: 200, description: 'Chronicle pin status updated' })
  async pinChronicle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('pinned') pinned: boolean,
  ) {
    return this.chronicleService.pinChronicle(id, pinned);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a chronicle (author while pending, or admin anytime)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Chronicle deleted' })
  async deleteChronicle(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chronicleService.deleteChronicle(id, user);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Toggle like' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, description: 'Like toggled' })
  async toggleLike(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chronicleService.toggleLike(id, user.id);
  }
}
