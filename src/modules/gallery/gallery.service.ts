import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { ListMediaDto } from './dto/list-media.dto';

const galleryMediaInclude = {
  tags: true,
  bodies: {
    select: { id: true, fullname: true, profile: { select: { profilePhoto: true } } },
  },
  album: {
    select: { id: true, name: true },
  },
} satisfies Prisma.GalleryMediaInclude;

@Injectable()
export class GalleryService {
  constructor(private readonly prisma: PrismaService) {}

  createAlbum(userId: string, dto: CreateAlbumDto) {
    return this.prisma.galleryAlbum.create({
      data: {
        ...dto,
        createdBy: userId,
      },
    });
  }

  listAlbums() {
    return this.prisma.galleryAlbum.findMany({
      include: {
        _count: {
          select: { media: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getAlbum(id: string) {
    return this.prisma.galleryAlbum.findUnique({
      where: { id },
      include: { media: true },
    }).then((album) => {
      if (!album) {
        throw new NotFoundException('Album not found');
      }

      return album;
    });
  }

  async updateAlbum(id: string, dto: UpdateAlbumDto) {
    const album = await this.prisma.galleryAlbum.findUnique({ where: { id } });
    if (!album) throw new NotFoundException('Album not found');

    return this.prisma.galleryAlbum.update({
      where: { id },
      data: dto,
    });
  }

  async deleteAlbum(id: string) {
    const album = await this.prisma.galleryAlbum.findUnique({ where: { id } });
    if (!album) throw new NotFoundException('Album not found');

    return this.prisma.galleryAlbum.delete({
      where: { id },
    });
  }

  async createMedia(userId: string, dto: CreateMediaDto) {
    const { tags, bodyIds, dateTaken, urls, ...rest } = dto;
    
    const createdItems = await Promise.all(
      urls.map(async (url) => {
        const createMedia = () => this.prisma.galleryMedia.create({
          data: {
            ...rest,
            url,
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
          include: galleryMediaInclude,
        });

        if (rest.hash) {
          const existing = await this.prisma.galleryMedia.findFirst({
            where: { hash: rest.hash },
            include: galleryMediaInclude,
          });
          if (existing) {
            return existing;
          }
        }

        return createMedia();
      })
    );

    return createdItems;
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

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { caption: { contains: query.search, mode: 'insensitive' } },
        { album: { name: { contains: query.search, mode: 'insensitive' } } },
        { tags: { some: { name: { contains: query.search, mode: 'insensitive' } } } },
        { bodies: { some: { fullname: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    const skip = query.skip ? Number(query.skip) : 0;
    const take = query.take ? Number(query.take) : 50;

    return Promise.all([
      this.prisma.galleryMedia.count({ where }),
      this.prisma.galleryMedia.findMany({
        where,
        include: galleryMediaInclude,
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
          { dateTaken: 'desc' }
        ],
        skip,
        take,
      }),
    ]).then(([totalRecords, data]) => ({
      totalRecords,
      data,
    }));
  }

  async getMedia(id: string) {
    const media = await this.prisma.galleryMedia.findUnique({
      where: { id },
      include: galleryMediaInclude,
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    const creatorProfile = await this.prisma.profile.findUnique({
      where: { id: media.createdBy },
      select: { displayName: true },
    });

    const updaterProfile = media.updatedBy ? await this.prisma.profile.findUnique({
      where: { id: media.updatedBy },
      select: { displayName: true },
    }) : null;

    return {
      ...media,
      creator: creatorProfile ? { displayName: creatorProfile.displayName } : null,
      updater: updaterProfile ? { displayName: updaterProfile.displayName } : null,
    };
  }

  updateMedia(userId: string, id: string, dto: UpdateMediaDto) {
    const { tags, bodyIds, dateTaken, urls, ...rest } = dto;

    return this.prisma.galleryMedia.update({
      where: { id },
      data: {
        ...rest,
        updatedBy: userId,
        ...(dateTaken && { dateTaken: new Date(dateTaken) }),
        ...(tags && {
          tags: {
            set: [],
            connectOrCreate: tags.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          },
        }),
        ...(bodyIds && {
          bodies: {
            set: bodyIds.map((bid) => ({ id: bid })),
          },
        }),
      },
      include: galleryMediaInclude,
    });
  }

  softDeleteMedia(id: string) {
    return this.prisma.galleryMedia.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  restoreMedia(id: string) {
    return this.prisma.galleryMedia.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  permanentlyDeleteMedia(id: string) {
    return this.prisma.galleryMedia.delete({
      where: { id },
    });
  }

  getStorageStats() {
    return Promise.all([
      this.prisma.galleryMedia.count({
        where: { deletedAt: null }
      }),
      this.prisma.galleryMedia.aggregate({
        _sum: { sizeBytes: true },
        where: { deletedAt: null }
      }),
    ]).then(([totalMedia, sizeResult]) => ({
      totalMedia,
      totalSizeBytes: sizeResult._sum.sizeBytes || 0,
    }));
  }
}
