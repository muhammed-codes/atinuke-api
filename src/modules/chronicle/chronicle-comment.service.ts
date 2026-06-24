import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { PaginatedResult, paginate } from '../../common/pagination/pagination.util';
import { UserRole } from '@prisma/client';

@Injectable()
export class ChronicleCommentService {
  constructor(private readonly prisma: PrismaService) {}

  async addComment(chronicleId: string, dto: CreateCommentDto, authorId: string) {
    const chronicle = await this.prisma.chronicle.findUnique({
      where: { id: chronicleId },
    });

    if (!chronicle || chronicle.status !== 'PUBLISHED') {
      throw new NotFoundException('Chronicle not found or not published');
    }

    return this.prisma.chronicleComment.create({
      data: {
        chronicleId,
        authorId,
        content: dto.content,
      },
    });
  }

  async updateComment(commentId: string, dto: UpdateCommentDto, userId: string) {
    const comment = await this.prisma.chronicleComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return this.prisma.chronicleComment.update({
      where: { id: commentId },
      data: { content: dto.content },
    });
  }

  async deleteComment(commentId: string, user: AuthenticatedUser) {
    const comment = await this.prisma.chronicleComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.chronicleComment.delete({
      where: { id: commentId },
    });
  }

  async listComments(chronicleId: string, dto: PaginationDto): Promise<PaginatedResult<any>> {
    const chronicle = await this.prisma.chronicle.findUnique({
      where: { id: chronicleId },
    });

    if (!chronicle) {
      throw new NotFoundException('Chronicle not found');
    }

    const skip = dto.skip ?? 0;
    const take = dto.take ?? 20;

    const [comments, total] = await Promise.all([
      this.prisma.chronicleComment.findMany({
        where: { chronicleId },
        orderBy: { createdAt: 'asc' },
        skip,
        take,
      }),
      this.prisma.chronicleComment.count({ where: { chronicleId } }),
    ]);

    const authorIds = [...new Set(comments.map((c) => c.authorId))];
    const profiles = await this.prisma.profile.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, displayName: true, profilePhoto: true },
    });

    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    const enrichedComments = comments.map((comment) => {
      const profile = profileMap.get(comment.authorId);
      return {
        ...comment,
        author: profile
          ? { displayName: profile.displayName, profilePhoto: profile.profilePhoto }
          : null,
      };
    });

    return paginate(enrichedComments, total);
  }
}
