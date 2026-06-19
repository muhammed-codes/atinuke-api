import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { ListMediaDto } from './dto/list-media.dto';

@Injectable()
export class GalleryService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Albums ---

  async createAlbum(userId: string, dto: CreateAlbumDto) {
    return this.prisma.galleryAlbum.create({
      data: {
        ...dto,
        createdBy: userId,
      },
    });
  }

  async listAlbums() {
    return this.prisma.galleryAlbum.findMany({
      include: {
        _count: {
          select: { media: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAlbum(id: string) {
    const album = await this.prisma.galleryAlbum.findUnique({
      where: { id },
      include: { media: true },
    });
    if (!album) throw new NotFoundException('Album not found');
    return album;
  }

  async updateAlbum(id: string, dto: UpdateAlbumDto) {
    return this.prisma.galleryAlbum.update({
      where: { id },
      data: dto,
    });
  }

  async deleteAlbum(id: string) {
    return this.prisma.galleryAlbum.delete({
      where: { id },
    });
  }

  // --- Media ---

  async createMedia(userId: string, dto: CreateMediaDto) {
    const { tags, bodyIds, dateTaken, ...rest } = dto;
    
    // Check for duplicates if hash is provided
    if (rest.hash) {
      const existing = await this.prisma.galleryMedia.findFirst({
        where: { hash: rest.hash },
      });
      if (existing) {
        return existing; // Or throw ConflictException based on design
      }
    }

    return this.prisma.galleryMedia.create({
      data: {
        ...rest,
        dateTaken: dateTaken ? new Date(dateTaken) : undefined,
        createdBy: userId,
        tags: tags ? {
          connectOrCreate: tags.map((tag) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        } : undefined,
        bodies: bodyIds ? {
          connect: bodyIds.map((id) => ({ id })),
        } : undefined,
      },
      include: {
        tags: true,
        bodies: {
          select: { id: true, fullname: true, profile: { select: { profilePhoto: true } } }
        },
      },
    });
  }

  listMedia(query: ListMediaDto) {
    const where: Prisma.GalleryMediaWhereInput = {};

    if (query.isDeleted === 'true') {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    if (query.albumId) where.albumId = query.albumId;
    if (query.bodyId) where.bodies = { some: { id: query.bodyId } };
    if (query.isPinned === 'true') where.isPinned = true;
    if (query.untagged === 'true') where.bodies = { none: {} };
    if (query.mediaType) where.mediaType = query.mediaType;

    if (query.startDate || query.endDate) {
      where.dateTaken = {};
      if (query.startDate) where.dateTaken.gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.dateTaken.lte = end;
      }
    }

    return this.prisma.galleryMedia.findMany({
      where,
      include: {
        tags: true,
        bodies: {
          select: { id: true, fullname: true, profile: { select: { profilePhoto: true } } }
        },
        album: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { dateTaken: 'desc' },
        { createdAt: 'desc' }
      ],
    });
  }

  getMedia(id: string) {
    return this.prisma.galleryMedia.findUnique({
      where: { id },
      include: {
        tags: true,
        bodies: {
          select: { id: true, fullname: true, profile: { select: { profilePhoto: true } } },
        },
        album: {
          select: { id: true, name: true },
        },
      },
    }).then((media) => {
      if (!media) {
        throw new NotFoundException('Media not found');
      }

      return media;
    });
  }

  async updateMedia(id: string, dto: UpdateMediaDto) {
    const { tags, bodyIds, dateTaken, ...rest } = dto;

    return this.prisma.galleryMedia.update({
      where: { id },
      data: {
        ...rest,
        ...(dateTaken && { dateTaken: new Date(dateTaken) }),
        ...(tags && {
          tags: {
            set: [], // clear existing
            connectOrCreate: tags.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          },
        }),
        ...(bodyIds && {
          bodies: {
            set: bodyIds.map((bid) => ({ id: bid })), // override existing
          },
        }),
      },
      include: {
        tags: true,
        bodies: true,
      },
    });
  }

  async softDeleteMedia(id: string) {
    return this.prisma.galleryMedia.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restoreMedia(id: string) {
    return this.prisma.galleryMedia.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async permanentlyDeleteMedia(id: string) {
    return this.prisma.galleryMedia.delete({
      where: { id },
    });
  }

  async getStorageStats() {
    const totalMedia = await this.prisma.galleryMedia.count({
      where: { deletedAt: null }
    });
    
    const sizeResult = await this.prisma.galleryMedia.aggregate({
      _sum: { sizeBytes: true },
      where: { deletedAt: null }
    });

    return {
      totalMedia,
      totalSizeBytes: sizeResult._sum.sizeBytes || 0,
    };
  }
}
