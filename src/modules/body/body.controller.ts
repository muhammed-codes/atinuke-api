import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { SupabaseJwtGuard } from '../../core/auth/supabase-jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BodyService } from './body.service';
import { BodyTreeService } from './body-tree.service';
import { AddSpouseDto } from './dto/add-spouse.dto';
import { BodyPageDto } from './dto/body-page.dto';
import { CreateBodyDto } from './dto/create-body.dto';
import { UpdateBodyDto } from './dto/update-body.dto';
import { UpdateSpouseStatusDto } from './dto/update-spouse-status.dto';
import { CreateNuclearFamilyDto } from './dto/create-nuclear-family.dto';

@ApiTags('Body')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard)
@Controller('body')
export class BodyController {
  constructor(
    private readonly bodyService: BodyService,
    private readonly bodyTreeService: BodyTreeService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new body record (Admin only)' })
  @ApiResponse({ status: 201, description: 'Body created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createBody(
    @Body() dto: CreateBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bodyService.createBody(dto, user.id);
  }

  @Post('nuclear-family')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a whole nuclear family at once (Admin only)' })
  @ApiResponse({ status: 201, description: 'Nuclear family created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createNuclearFamily(
    @Body() dto: CreateNuclearFamilyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bodyService.createNuclearFamily(dto, user.id);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get the full family tree (depth-sliced)' })
  @ApiQuery({ name: 'depth', required: false, type: Number, description: '0 = full tree' })
  @ApiResponse({ status: 200, description: 'Family tree returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTree(@Query('depth', new ParseIntPipe({ optional: true })) depth: number = 0) {
    return this.bodyTreeService.getTree(depth);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated list of body records' })
  @ApiResponse({ status: 200, description: 'Paginated body list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() dto: BodyPageDto) {
    return this.bodyService.findAll(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a body record by ID with full relations' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Body record returned' })
  @ApiResponse({ status: 404, description: 'Body not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.bodyService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a body record' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Body updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden — members can only update their own record' })
  @ApiResponse({ status: 404, description: 'Body not found' })
  async updateBody(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bodyService.updateBody(id, dto, user);
  }

  @Post(':id/spouse')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a spouse relationship (Admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, description: 'Spouse relationship created' })
  @ApiResponse({ status: 400, description: 'Validation or spouse limit error' })
  @ApiResponse({ status: 409, description: 'Spouse relationship already exists' })
  async addSpouse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddSpouseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bodyService.addSpouse(id, dto, user.id);
  }

  @Put(':id/spouse/:spouseId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update spouse relationship status (Admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'spouseId', type: String })
  @ApiResponse({ status: 200, description: 'Spouse status updated' })
  @ApiResponse({ status: 404, description: 'Spouse relationship not found' })
  async updateSpouseStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('spouseId', ParseUUIDPipe) spouseId: string,
    @Body() dto: UpdateSpouseStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bodyService.updateSpouseStatus(id, spouseId, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a body record (Admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Body deleted successfully' })
  @ApiResponse({ status: 404, description: 'Body not found' })
  async deleteBody(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bodyService.deleteBody(id, user.id);
  }

  @Delete(':id/spouse/:spouseId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove a spouse relationship (Admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'spouseId', type: String })
  @ApiResponse({ status: 200, description: 'Spouse relationship removed' })
  @ApiResponse({ status: 404, description: 'Spouse relationship not found' })
  async removeSpouse(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('spouseId', ParseUUIDPipe) spouseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bodyService.removeSpouse(id, spouseId, user.id);
  }
}
