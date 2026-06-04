import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { SupabaseJwtGuard } from '../../core/auth/supabase-jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminService } from './admin.service';
import { LinkBodyDto } from './dto/link-body.dto';
import { ListUsersDto } from './dto/list-users.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List all users with optional filters (Admin only)' })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  async listUsers(@Query() dto: ListUsersDto) {
    return this.adminService.listUsers(dto);
  }

  @Put('users/:id/approve')
  @ApiOperation({ summary: 'Approve a user account (Admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'User approved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async approveUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.approveUser(id);
  }

  @Put('users/:id/decline')
  @ApiOperation({ summary: 'Decline a user account (Admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'User declined' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async declineUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.declineUser(id);
  }

  @Put('users/:id/promote')
  @ApiOperation({ summary: 'Promote user to Admin role (Admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'User promoted to admin' })
  @ApiResponse({ status: 400, description: 'User must be approved first' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async promoteToAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.promoteToAdmin(id);
  }

  @Put('users/:id/body')
  @ApiOperation({ summary: 'Link a body record to a user (Admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Body linked to user' })
  @ApiResponse({ status: 404, description: 'User or body not found' })
  @ApiResponse({ status: 409, description: 'Body already linked to another user' })
  async linkBody(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkBodyDto,
  ) {
    return this.adminService.linkBody(id, dto);
  }

  @Delete('users/:id/body')
  @ApiOperation({ summary: 'Unlink body from a user (Admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Body unlinked from user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unlinkBody(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.unlinkBody(id);
  }
}
