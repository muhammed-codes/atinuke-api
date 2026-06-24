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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ChronicleCommentService } from './chronicle-comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { SupabaseJwtGuard } from '../../core/auth/supabase-jwt.guard';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';

@ApiTags('Chronicle')
@ApiBearerAuth()
@UseGuards(SupabaseJwtGuard)
@Controller('chronicle/:chronicleId/comment')
export class ChronicleCommentController {
  constructor(private readonly chronicleCommentService: ChronicleCommentService) {}

  @Get()
  @ApiOperation({ summary: 'List comments for a chronicle' })
  @ApiParam({ name: 'chronicleId', type: String })
  @ApiResponse({ status: 200, description: 'Paginated comments list' })
  async listComments(
    @Param('chronicleId', ParseUUIDPipe) chronicleId: string,
    @Query() dto: PaginationDto,
  ) {
    return this.chronicleCommentService.listComments(chronicleId, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Add a comment to a chronicle' })
  @ApiParam({ name: 'chronicleId', type: String })
  @ApiResponse({ status: 201, description: 'Comment added' })
  async addComment(
    @Param('chronicleId', ParseUUIDPipe) chronicleId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chronicleCommentService.addComment(chronicleId, dto, user.id);
  }

  @Put(':commentId')
  @ApiOperation({ summary: 'Update your own comment' })
  @ApiParam({ name: 'chronicleId', type: String })
  @ApiParam({ name: 'commentId', type: String })
  @ApiResponse({ status: 200, description: 'Comment updated' })
  async updateComment(
    @Param('chronicleId', ParseUUIDPipe) chronicleId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chronicleCommentService.updateComment(commentId, dto, user.id);
  }

  @Delete(':commentId')
  @ApiOperation({ summary: 'Delete a comment (own or admin)' })
  @ApiParam({ name: 'chronicleId', type: String })
  @ApiParam({ name: 'commentId', type: String })
  @ApiResponse({ status: 200, description: 'Comment deleted' })
  async deleteComment(
    @Param('chronicleId', ParseUUIDPipe) chronicleId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.chronicleCommentService.deleteComment(commentId, user);
  }
}
