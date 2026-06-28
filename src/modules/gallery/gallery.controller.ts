import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { GalleryService } from './gallery.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { SupabaseJwtGuard } from '../../core/auth/supabase-jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { CurrentUser } from '../../core/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { ListMediaDto } from './dto/list-media.dto';

@UseGuards(SupabaseJwtGuard)
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get('stats')
  getStorageStats() {
    return this.galleryService.getStorageStats();
  }

  @Post('albums')
  createAlbum(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAlbumDto) {
    return this.galleryService.createAlbum(user.id, dto);
  }

  @Get('albums')
  listAlbums() {
    return this.galleryService.listAlbums();
  }

  @Get('albums/:id')
  getAlbum(@Param('id') id: string) {
    return this.galleryService.getAlbum(id);
  }

  @Patch('albums/:id')
  updateAlbum(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAlbumDto) {
    return this.galleryService.updateAlbum(id, dto);
  }

  @Delete('albums/:id')
  deleteAlbum(@Param('id', ParseUUIDPipe) id: string) {
    return this.galleryService.deleteAlbum(id);
  }

  @Post('media')
  createMedia(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMediaDto) {
    return this.galleryService.createMedia(user.id, dto);
  }

  @Get('media')
  listMedia(@Query() query: ListMediaDto) {
    return this.galleryService.listMedia(query);
  }

  @Get('media/:id')
  getMedia(@Param('id', ParseUUIDPipe) id: string) {
    return this.galleryService.getMedia(id);
  }

  @Patch('media/:id')
  updateMedia(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMediaDto) {
    return this.galleryService.updateMedia(user.id, id, dto);
  }

  @Delete('media/:id')
  softDeleteMedia(@Param('id', ParseUUIDPipe) id: string) {
    return this.galleryService.softDeleteMedia(id);
  }

  @Post('media/:id/restore')
  restoreMedia(@Param('id', ParseUUIDPipe) id: string) {
    return this.galleryService.restoreMedia(id);
  }

  @Delete('media/:id/permanent')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  permanentlyDeleteMedia(@Param('id', ParseUUIDPipe) id: string) {
    return this.galleryService.permanentlyDeleteMedia(id);
  }
}
