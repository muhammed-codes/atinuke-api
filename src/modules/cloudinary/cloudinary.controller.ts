import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SupabaseJwtGuard } from '../../core/auth/supabase-jwt.guard';
import { CloudinaryService } from '../../core/cloudinary/cloudinary.service';

@ApiTags('Cloudinary')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard)
@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Get('sign')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Get signed upload params for client-side direct upload' })
  @ApiQuery({ name: 'folder', required: false, description: 'Target folder in Cloudinary' })
  @ApiResponse({ status: 200, description: 'Signed upload params returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getSignedUploadParams(@Query('folder') folder: string = 'family-photos') {
    const allowed = ['family-photos', 'profile-photos'];
    if (!allowed.includes(folder)) {
      throw new BadRequestException(`Invalid folder. Allowed: ${allowed.join(', ')}`);
    }
    return this.cloudinaryService.generateSignedUploadParams(folder);
  }
}
