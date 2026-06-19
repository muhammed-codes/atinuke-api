import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { SupabaseJwtGuard } from '../../core/auth/supabase-jwt.guard';

@UseGuards(SupabaseJwtGuard)
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  // --- Stats ---
  @Get('stats')
  getStorageStats() {
    return this.galleryService.getStorageStats();
  }

  // --- Albums ---
  @Post('albums')
  createAlbum(@Req() req: any, @Body() dto: CreateAlbumDto) {
    return this.galleryService.createAlbum(req.user.id, dto);
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
  updateAlbum(@Param('id') id: string, @Body() dto: UpdateAlbumDto) {
    return this.galleryService.updateAlbum(id, dto);
  }

  @Delete('albums/:id')
  deleteAlbum(@Param('id') id: string) {
    return this.galleryService.deleteAlbum(id);
  }

  // --- Media ---
  @Post('media')
  createMedia(@Req() req: any, @Body() dto: CreateMediaDto) {
    return this.galleryService.createMedia(req.user.id, dto);
  }

  @Get('media')
  listMedia(@Query() query: any) {
    return this.galleryService.listMedia(query);
  }

  @Patch('media/:id')
  updateMedia(@Param('id') id: string, @Body() dto: UpdateMediaDto) {
    return this.galleryService.updateMedia(id, dto);
  }

  @Delete('media/:id')
  softDeleteMedia(@Param('id') id: string) {
    return this.galleryService.softDeleteMedia(id);
  }

  @Post('media/:id/restore')
  restoreMedia(@Param('id') id: string) {
    return this.galleryService.restoreMedia(id);
  }

  @Delete('media/:id/permanent')
  permanentlyDeleteMedia(@Param('id') id: string) {
    return this.galleryService.permanentlyDeleteMedia(id);
  }
}
