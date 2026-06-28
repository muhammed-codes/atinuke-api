import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateChronicleDto } from './dto/create-chronicle.dto';
import { UpdateChronicleDto } from './dto/update-chronicle.dto';
import { ChroniclePageDto } from './dto/chronicle-page.dto';
import { ReviewChronicleDto } from './dto/review-chronicle.dto';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { ChronicleResponse, ChronicleSummary } from './types/chronicle-response.type';
import { ChronicleSubmittedEvent, ChronicleApprovedEvent } from '../../events/chronicle/chronicle.events';
import { UserRole, ChronicleAttributionType, ChronicleStatus, Prisma } from '@prisma/client';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { PaginatedResult, paginate } from '../../common/pagination/pagination.util';

@Injectable()
export class ChronicleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async validateAttribution(dto: CreateChronicleDto | UpdateChronicleDto) {
    if (dto.attributedToType === ChronicleAttributionType.MEMBER) {
      if (!dto.attributedToBodyId) throw new BadRequestException('attributedToBodyId is required for MEMBER attribution');
      const body = await this.prisma.body.findUnique({ where: { id: dto.attributedToBodyId } });
      if (!body) throw new NotFoundException('Attributed body not found');
    } else if (dto.attributedToType === ChronicleAttributionType.CUSTOM) {
      if (!dto.attributedToLabel) throw new BadRequestException('attributedToLabel is required for CUSTOM attribution');
    } else if (dto.attributedToType === ChronicleAttributionType.SELF || dto.attributedToType === ChronicleAttributionType.ADMIN) {
      dto.attributedToBodyId = undefined;
      dto.attributedToLabel = undefined;
    }
  }

  private async validateTaggedBodies(taggedBodyIds?: string[]) {
    if (taggedBodyIds && taggedBodyIds.length > 0) {
      const bodies = await this.prisma.body.findMany({ where: { id: { in: taggedBodyIds } } });
      const foundIds = bodies.map((b) => b.id);
      const missing = taggedBodyIds.filter((id) => !foundIds.includes(id));
      if (missing.length > 0) throw new NotFoundException(`Tagged bodies not found: ${missing.join(', ')}`);
    }
  }

  async submitChronicle(dto: CreateChronicleDto, submittedBy: string) {
    await this.validateAttribution(dto);
    await this.validateTaggedBodies(dto.taggedBodyIds);

    const chronicle = await this.prisma.$transaction(async (tx) => {
      return tx.chronicle.create({
        data: {
          title: dto.title,
          content: dto.content,
          category: dto.category,
          status: ChronicleStatus.PENDING,
          isEdit: false,
          submittedBy,
          attributedToType: dto.attributedToType,
          attributedToBodyId: dto.attributedToBodyId,
          attributedToLabel: dto.attributedToLabel,
          youtubeLinks: dto.youtubeLinks || [],
          media: {
            create: dto.media?.map((m, i) => ({ type: m.type, url: m.url, position: i })) || [],
          },
          taggedBodies: {
            create: dto.taggedBodyIds?.map((id) => ({ bodyId: id })) || [],
          },
        },
        include: { media: true, taggedBodies: true },
      });
    });

    this.eventEmitter.emit('chronicle.submitted', new ChronicleSubmittedEvent(chronicle.id));
    return chronicle;
  }

  async createByAdmin(dto: CreateChronicleDto, adminId: string) {
    await this.validateAttribution(dto);
    await this.validateTaggedBodies(dto.taggedBodyIds);

    return this.prisma.$transaction(async (tx) => {
      return tx.chronicle.create({
        data: {
          title: dto.title,
          content: dto.content,
          category: dto.category,
          status: ChronicleStatus.PUBLISHED,
          isEdit: false,
          submittedBy: adminId,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          attributedToType: dto.attributedToType,
          attributedToBodyId: dto.attributedToBodyId,
          attributedToLabel: dto.attributedToLabel,
          youtubeLinks: dto.youtubeLinks || [],
          media: {
            create: dto.media?.map((m, i) => ({ type: m.type, url: m.url, position: i })) || [],
          },
          taggedBodies: {
            create: dto.taggedBodyIds?.map((id) => ({ bodyId: id })) || [],
          },
        },
        include: { media: true, taggedBodies: true },
      });
    });
  }

  async submitEdit(chronicleId: string, dto: UpdateChronicleDto, user: AuthenticatedUser) {
    const original = await this.prisma.chronicle.findUnique({
      where: { id: chronicleId },
      include: { media: true, taggedBodies: true },
    });

    if (!original) throw new NotFoundException('Chronicle not found');
    if (original.status !== ChronicleStatus.PUBLISHED || original.isEdit) {
      throw new BadRequestException('Only published chronicles can be edited');
    }

    if (original.submittedBy !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You are not allowed to edit this chronicle');
    }

    const pendingEdit = await this.prisma.chronicle.findFirst({
      where: { publishedVersionId: chronicleId, status: ChronicleStatus.PENDING },
    });
    if (pendingEdit) throw new ConflictException('This chronicle already has a pending edit');

    const mergedDto: UpdateChronicleDto = {
      title: dto.title ?? original.title,
      content: dto.content ?? original.content,
      category: dto.category ?? original.category,
      attributedToType: dto.attributedToType ?? original.attributedToType,
      attributedToBodyId: dto.attributedToBodyId ?? original.attributedToBodyId ?? undefined,
      attributedToLabel: dto.attributedToLabel ?? original.attributedToLabel ?? undefined,
      media: dto.media !== undefined ? dto.media : original.media.map((m) => ({ type: m.type, url: m.url })),
      taggedBodyIds: dto.taggedBodyIds !== undefined ? dto.taggedBodyIds : original.taggedBodies.map((tb) => tb.bodyId),
      youtubeLinks: dto.youtubeLinks !== undefined ? dto.youtubeLinks : original.youtubeLinks,
    };

    await this.validateAttribution(mergedDto);
    await this.validateTaggedBodies(mergedDto.taggedBodyIds);

    const edit = await this.prisma.$transaction(async (tx) => {
      return tx.chronicle.create({
        data: {
          title: mergedDto.title!,
          content: mergedDto.content!,
          category: mergedDto.category!,
          status: ChronicleStatus.PENDING,
          isEdit: true,
          publishedVersionId: chronicleId,
          submittedBy: original.submittedBy,
          attributedToType: mergedDto.attributedToType!,
          attributedToBodyId: mergedDto.attributedToBodyId,
          attributedToLabel: mergedDto.attributedToLabel,
          youtubeLinks: mergedDto.youtubeLinks || [],
          media: {
            create: mergedDto.media?.map((m, i) => ({ type: m.type, url: m.url, position: i })) || [],
          },
          taggedBodies: {
            create: mergedDto.taggedBodyIds?.map((id) => ({ bodyId: id })) || [],
          },
        },
        include: { media: true, taggedBodies: true },
      });
    });

    this.eventEmitter.emit('chronicle.submitted', new ChronicleSubmittedEvent(edit.id));
    return edit;
  }

  async approveChronicle(id: string, reviewerId: string) {
    const chronicle = await this.prisma.chronicle.findUnique({
      where: { id },
      include: { media: true, taggedBodies: true },
    });

    if (!chronicle) throw new NotFoundException('Chronicle not found');
    if (chronicle.status !== ChronicleStatus.PENDING) {
      throw new BadRequestException('Chronicle is not pending review');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      if (!chronicle.isEdit) {
        return tx.chronicle.update({
          where: { id },
          data: {
            status: ChronicleStatus.PUBLISHED,
            reviewedBy: reviewerId,
            reviewedAt: new Date(),
          },
          include: { media: true, taggedBodies: true },
        });
      } else {
        await tx.chronicleMedia.deleteMany({ where: { chronicleId: chronicle.publishedVersionId! } });
        await tx.chronicleTaggedBody.deleteMany({ where: { chronicleId: chronicle.publishedVersionId! } });

        const updatedPublished = await tx.chronicle.update({
          where: { id: chronicle.publishedVersionId! },
          data: {
            title: chronicle.title,
            content: chronicle.content,
            category: chronicle.category,
            youtubeLinks: chronicle.youtubeLinks,
            attributedToType: chronicle.attributedToType,
            attributedToBodyId: chronicle.attributedToBodyId,
            attributedToLabel: chronicle.attributedToLabel,
            reviewedBy: reviewerId,
            reviewedAt: new Date(),
            media: {
              create: chronicle.media.map((m) => ({ type: m.type, url: m.url, position: m.position })),
            },
            taggedBodies: {
              create: chronicle.taggedBodies.map((tb) => ({ bodyId: tb.bodyId })),
            },
          },
          include: { media: true, taggedBodies: true },
        });

        await tx.chronicle.delete({ where: { id } });
        return updatedPublished;
      }
    });

    this.eventEmitter.emit('chronicle.approved', new ChronicleApprovedEvent(result.id));
    return result;
  }

  async declineChronicle(id: string, dto: ReviewChronicleDto, reviewerId: string) {
    const chronicle = await this.prisma.chronicle.findUnique({ where: { id } });
    if (!chronicle) throw new NotFoundException('Chronicle not found');
    if (chronicle.status !== ChronicleStatus.PENDING) throw new BadRequestException('Chronicle is not pending review');
    if (!dto.declineReason) throw new BadRequestException('Decline reason is required');

    return this.prisma.chronicle.update({
      where: { id },
      data: {
        status: ChronicleStatus.DECLINED,
        declineReason: dto.declineReason,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });
  }

  async findById(id: string, requestingUser: AuthenticatedUser): Promise<ChronicleResponse> {
    const chronicle = await this.prisma.chronicle.findUnique({
      where: { id },
      include: {
        media: { orderBy: [{ type: 'asc' }, { position: 'asc' }] },
        taggedBodies: { include: { body: { include: { photos: { take: 1, orderBy: { position: 'asc' } } } } } },
        attributedToBody: { include: { photos: { take: 1, orderBy: { position: 'asc' } } } },
        comments: { orderBy: { createdAt: 'asc' } },
        likes: { select: { userId: true } },
        pendingEdit: true,
      },
    });

    if (!chronicle) throw new NotFoundException('Chronicle not found');

    if (chronicle.status !== ChronicleStatus.PUBLISHED) {
      if (chronicle.submittedBy !== requestingUser.id && requestingUser.role !== UserRole.ADMIN) {
        throw new NotFoundException('Chronicle not found');
      }
    }

    const profileMap = new Map<string, { id: string; displayName: string; profilePhoto: string | null }>();
    if (chronicle.comments.length > 0) {
      const authorIds = [...new Set(chronicle.comments.map((c) => c.authorId))];
      const profiles = await this.prisma.profile.findMany({
        where: { id: { in: authorIds } },
        select: { id: true, displayName: true, profilePhoto: true },
      });
      for (const p of profiles) profileMap.set(p.id, p);
    }

    const commentsWithAuthors = chronicle.comments.map((c) => {
      const p = profileMap.get(c.authorId);
      return {
        ...c,
        author: p ? { displayName: p.displayName, profilePhoto: p.profilePhoto } : null,
      };
    });

    let pendingEdit = null;
    if (chronicle.status === ChronicleStatus.PUBLISHED && chronicle.pendingEdit) {
      if (chronicle.submittedBy === requestingUser.id || requestingUser.role === UserRole.ADMIN) {
        pendingEdit = chronicle.pendingEdit;
      }
    }

    return {
      ...chronicle,
      comments: commentsWithAuthors as any,
      likes: {
        count: chronicle.likes.length,
        userHasLiked: chronicle.likes.some((l) => l.userId === requestingUser.id),
      },
      pendingEdit,
    } as any;
  }

  async findAll(dto: ChroniclePageDto): Promise<PaginatedResult<ChronicleSummary>> {
    const skip = dto.skip ?? 0;
    const take = dto.take ?? 20;

    const where: Prisma.ChronicleWhereInput = {
      isEdit: false,
    };

    if (dto.status) {
      where.status = dto.status;
    } else {
      where.status = ChronicleStatus.PUBLISHED;
    }

    if (dto.keyword) {
      const matches = await this.prisma.$queryRaw<{id: string}[]>`
        SELECT id FROM chronicles 
        WHERE to_tsvector('english', title) @@ plainto_tsquery('english', ${dto.keyword})
      `;
      const matchIds = matches.map((m) => m.id);
      if (matchIds.length === 0) {
        return paginate([], 0);
      }
      where.id = { in: matchIds };
    }
    if (dto.category) where.category = dto.category;
    if (dto.pinnedOnly) where.isPinned = true;
    if (dto.taggedBodyId) {
      where.taggedBodies = { some: { bodyId: dto.taggedBodyId } };
    }

    let orderBy: any;
    if (dto.sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (dto.sortBy === 'mostLiked') {
      orderBy = { likes: { _count: 'desc' } };
    } else {
      // newest + pinned first
      orderBy = [{ isPinned: 'desc' }, { createdAt: 'desc' }];
    }

    const [chronicles, total] = await Promise.all([
      this.prisma.chronicle.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          media: { take: 1, orderBy: { position: 'asc' } },
          attributedToBody: { select: { id: true, fullname: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      this.prisma.chronicle.count({ where }),
    ]);

    if (chronicles.length === 0) {
      return paginate([], total);
    }

    const authorIds = [...new Set(chronicles.map((c) => c.submittedBy))];
    const profiles = await this.prisma.profile.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, displayName: true, profilePhoto: true },
    });
    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    const stripHtml = (html: string): string =>
      html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    const items = chronicles.map((c) => {
      const p = profileMap.get(c.submittedBy);
      return {
        id: c.id,
        title: c.title,
        excerpt: stripHtml(c.content).substring(0, 150),
        category: c.category,
        status: c.status,
        isPinned: c.isPinned,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        attributedToType: c.attributedToType,
        attributedToLabel: c.attributedToLabel,
        attributedToBodyId: c.attributedToBodyId,
        attributedToBody: c.attributedToBody,
        author: p ? { displayName: p.displayName, profilePhoto: p.profilePhoto } : null,
        media: c.media.map((m) => ({ type: m.type, url: m.url })),
        likes: { count: c._count.likes, userHasLiked: false },
        _count: { comments: c._count.comments },
      };
    });

    return paginate(items, total);
  }

  async findPendingQueue(dto: PaginationDto): Promise<PaginatedResult<any>> {
    const skip = dto.skip ?? 0;
    const take = dto.take ?? 20;

    const [items, total] = await Promise.all([
      this.prisma.chronicle.findMany({
        where: { status: ChronicleStatus.PENDING },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { publishedVersion: { select: { title: true } } },
      }),
      this.prisma.chronicle.count({ where: { status: ChronicleStatus.PENDING } }),
    ]);

    if (items.length === 0) {
      return paginate([], total);
    }

    const authorIds = [...new Set(items.map((c) => c.submittedBy))];
    const profiles = await this.prisma.profile.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, displayName: true, profilePhoto: true },
    });
    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    const enriched = items.map((c) => ({
      ...c,
      author: profileMap.get(c.submittedBy) || null,
    }));

    return paginate(enriched, total);
  }

  async pinChronicle(id: string, pinned: boolean) {
    const chronicle = await this.prisma.chronicle.findUnique({ where: { id } });
    if (!chronicle) throw new NotFoundException('Chronicle not found');
    if (chronicle.status !== ChronicleStatus.PUBLISHED) {
      throw new BadRequestException('Only published chronicles can be pinned');
    }

    return this.prisma.chronicle.update({
      where: { id },
      data: { isPinned: pinned },
    });
  }

  async deleteChronicle(id: string, user: AuthenticatedUser) {
    const chronicle = await this.prisma.chronicle.findUnique({ where: { id } });
    if (!chronicle) throw new NotFoundException('Chronicle not found');

    if (user.role !== UserRole.ADMIN) {
      if (chronicle.status !== ChronicleStatus.PENDING) {
        throw new ForbiddenException('Only admins can delete non-pending chronicles');
      }
      if (chronicle.submittedBy !== user.id) {
        throw new ForbiddenException('You can only delete your own pending chronicles');
      }
    }

    await this.prisma.chronicle.delete({ where: { id } });
  }

  async toggleLike(chronicleId: string, userId: string) {
    const chronicle = await this.prisma.chronicle.findUnique({ where: { id: chronicleId } });
    if (!chronicle || chronicle.status !== ChronicleStatus.PUBLISHED) {
      throw new NotFoundException('Published chronicle not found');
    }

    const existingLike = await this.prisma.chronicleLike.findUnique({
      where: { chronicleId_userId: { chronicleId, userId } },
    });

    if (existingLike) {
      await this.prisma.chronicleLike.delete({ where: { id: existingLike.id } });
    } else {
      await this.prisma.chronicleLike.create({
        data: { chronicleId, userId },
      });
    }

    const likeCount = await this.prisma.chronicleLike.count({ where: { chronicleId } });
    return { liked: !existingLike, likeCount };
  }
}
