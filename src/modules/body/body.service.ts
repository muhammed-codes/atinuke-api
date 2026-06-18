import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Body, BodyPhoto, BodySpouse, MarriageStatus, Sex, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { PaginatedResult, paginate } from '../../common/pagination/pagination.util';
import { PrismaService } from '../../core/prisma/prisma.service';
import { TreeCacheInvalidatedEvent } from '../../events/tree-cache/tree-cache.events';
import { AddSpouseDto } from './dto/add-spouse.dto';
import { BodyPageDto } from './dto/body-page.dto';
import { CreateBodyDto } from './dto/create-body.dto';
import { UpdateBodyDto } from './dto/update-body.dto';
import { UpdateSpouseStatusDto } from './dto/update-spouse-status.dto';

type BodyWithPhotos = Body & { photos: BodyPhoto[] };

type SpouseRelation = BodySpouse & {
  bodyA?: BodyWithPhotos;
  bodyB?: BodyWithPhotos;
};

export type BodyWithRelations = Body & {
  photos: BodyPhoto[];
  father: BodyWithPhotos | null;
  mother: BodyWithPhotos | null;
  spouses: {
    spouseRelationId: string;
    body: BodyWithPhotos;
    status: MarriageStatus;
    marriageDate: string | null;
    endDate: string | null;
  }[];
  children: BodyWithPhotos[];
};

const BODY_WITH_PHOTOS_INCLUDE = {
  photos: { orderBy: { position: 'asc' as const } },
} as const;

@Injectable()
export class BodyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createBody(dto: CreateBodyDto, createdBy: string): Promise<BodyWithRelations> {
    if (!dto.isAlive && !dto.deathDate) {
      throw new BadRequestException('deathDate is required when isAlive is false');
    }
    if (dto.isAlive && dto.deathDate) {
      throw new BadRequestException('deathDate must not be set when isAlive is true');
    }

    if (dto.fatherId) {
      const father = await this.prisma.body.findUnique({ where: { id: dto.fatherId } });
      if (!father) throw new NotFoundException('Father not found');
    }

    if (dto.motherId) {
      const mother = await this.prisma.body.findUnique({ where: { id: dto.motherId } });
      if (!mother) throw new NotFoundException('Mother not found');
    }

    const body = await this.prisma.$transaction(async (tx) => {
      const created = await tx.body.create({
        data: {
          fullname: dto.fullname,
          sex: dto.sex,
          dateOfBirth: new Date(dto.dateOfBirth),
          placeOfBirth: dto.placeOfBirth,
          nickname: dto.nickname,
          phoneNumber: dto.phoneNumber,
          occupation: dto.occupation,
          fatherId: dto.fatherId,
          motherId: dto.motherId,
          isAlive: dto.isAlive,
          deathDate: dto.deathDate,
          maritalStatus: dto.maritalStatus,
          notes: dto.notes,
          createdBy,
        },
      });

      if (dto.photos && dto.photos.length > 0) {
        await tx.bodyPhoto.createMany({
          data: dto.photos.map((url, position) => ({
            bodyId: created.id,
            url,
            position,
          })),
        });
      }

      return created;
    });

    this.eventEmitter.emit('tree-cache.invalidated', new TreeCacheInvalidatedEvent(createdBy));

    return this.findById(body.id);
  }

  async updateBody(
    id: string,
    dto: UpdateBodyDto,
    user: AuthenticatedUser,
  ): Promise<BodyWithRelations> {
    const existing = await this.prisma.body.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Body not found');

    if (user.role === UserRole.MEMBER) {
      if (user.bodyId !== id) {
        throw new ForbiddenException('Members can only update their own body record');
      }
      delete dto.fatherId;
      delete dto.motherId;
    }

    const isAlive = dto.isAlive ?? existing.isAlive;
    const deathDate = dto.deathDate ?? existing.deathDate;

    if (!isAlive && !deathDate) {
      throw new BadRequestException('deathDate is required when isAlive is false');
    }
    if (isAlive && deathDate) {
      throw new BadRequestException('deathDate must not be set when isAlive is true');
    }

    if (dto.fatherId) {
      const father = await this.prisma.body.findUnique({ where: { id: dto.fatherId } });
      if (!father) throw new NotFoundException('Father not found');
    }

    if (dto.motherId) {
      const mother = await this.prisma.body.findUnique({ where: { id: dto.motherId } });
      if (!mother) throw new NotFoundException('Mother not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.body.update({
        where: { id },
        data: {
          fullname: dto.fullname,
          sex: dto.sex,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          placeOfBirth: dto.placeOfBirth,
          nickname: dto.nickname,
          phoneNumber: dto.phoneNumber,
          occupation: dto.occupation,
          fatherId: dto.fatherId,
          motherId: dto.motherId,
          isAlive: dto.isAlive,
          deathDate: isAlive ? null : deathDate,
          maritalStatus: dto.maritalStatus,
          notes: dto.notes,
        },
      });

      if (dto.photos !== undefined) {
        await tx.bodyPhoto.deleteMany({ where: { bodyId: id } });
        if (dto.photos.length > 0) {
          await tx.bodyPhoto.createMany({
            data: dto.photos.map((url, position) => ({ bodyId: id, url, position })),
          });
        }
      }
    });

    this.eventEmitter.emit('tree-cache.invalidated', new TreeCacheInvalidatedEvent(user.id));

    return this.findById(id);
  }

  async findById(id: string): Promise<BodyWithRelations> {
    const body = await this.prisma.body.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { position: 'asc' } },
        father: { include: BODY_WITH_PHOTOS_INCLUDE },
        mother: { include: BODY_WITH_PHOTOS_INCLUDE },
        spousesAsA: {
          include: { bodyB: { include: BODY_WITH_PHOTOS_INCLUDE } },
        },
        spousesAsB: {
          include: { bodyA: { include: BODY_WITH_PHOTOS_INCLUDE } },
        },
      },
    });

    if (!body) throw new NotFoundException('Body not found');

    const children = await this.prisma.body.findMany({
      where: { OR: [{ fatherId: id }, { motherId: id }] },
      include: BODY_WITH_PHOTOS_INCLUDE,
    });

    const spousesFromA = body.spousesAsA.map((rel) => ({
      spouseRelationId: rel.id,
      body: (rel as SpouseRelation).bodyB as BodyWithPhotos,
      status: rel.status,
      marriageDate: rel.marriageDate,
      endDate: rel.endDate,
    }));

    const spousesFromB = body.spousesAsB.map((rel) => ({
      spouseRelationId: rel.id,
      body: (rel as SpouseRelation).bodyA as BodyWithPhotos,
      status: rel.status,
      marriageDate: rel.marriageDate,
      endDate: rel.endDate,
    }));

    return {
      ...body,
      spouses: [...spousesFromA, ...spousesFromB],
      children,
    } as BodyWithRelations;
  }

  async findAll(dto: BodyPageDto): Promise<PaginatedResult<Body>> {
    const where = {
      ...(dto.keyword && {
        OR: [
          { fullname: { contains: dto.keyword, mode: 'insensitive' as const } },
          { nickname: { contains: dto.keyword, mode: 'insensitive' as const } },
        ],
      }),
      ...(dto.sex !== undefined && { sex: dto.sex }),
      ...(dto.isAlive !== undefined && { isAlive: dto.isAlive }),
      ...(dto.occupation && {
        occupation: { contains: dto.occupation, mode: 'insensitive' as const },
      }),
    };

    const [data, totalRecords] = await Promise.all([
      this.prisma.body.findMany({
        where,
        skip: dto.skip,
        take: dto.take,
        include: BODY_WITH_PHOTOS_INCLUDE,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.body.count({ where }),
    ]);

    return paginate(data, totalRecords);
  }

  async addSpouse(id: string, dto: AddSpouseDto, actorId: string): Promise<BodyWithRelations> {
    if (id === dto.spouseId) {
      throw new BadRequestException('A person cannot be their own spouse');
    }

    const [bodyA, bodyB] = await Promise.all([
      this.prisma.body.findUnique({ where: { id } }),
      this.prisma.body.findUnique({ where: { id: dto.spouseId } }),
    ]);

    if (!bodyA) throw new NotFoundException('Body not found');
    if (!bodyB) throw new NotFoundException('Spouse body not found');

    await this.validateSpouseCount(id, bodyA.sex);
    await this.validateSpouseCount(dto.spouseId, bodyB.sex);

    const [pairA, pairB] = id < dto.spouseId ? [id, dto.spouseId] : [dto.spouseId, id];

    const existing = await this.prisma.bodySpouse.findUnique({
      where: { bodyIdA_bodyIdB: { bodyIdA: pairA, bodyIdB: pairB } },
    });

    if (existing) {
      throw new ConflictException('Spouse relationship already exists');
    }

    await this.prisma.bodySpouse.create({
      data: {
        bodyIdA: pairA,
        bodyIdB: pairB,
        status: dto.status,
        marriageDate: dto.marriageDate,
        endDate: dto.endDate,
      },
    });

    this.eventEmitter.emit('tree-cache.invalidated', new TreeCacheInvalidatedEvent(actorId));

    return this.findById(id);
  }

  async updateSpouseStatus(
    id: string,
    spouseId: string,
    dto: UpdateSpouseStatusDto,
    actorId: string,
  ): Promise<BodyWithRelations> {
    const [pairA, pairB] = id < spouseId ? [id, spouseId] : [spouseId, id];

    const relation = await this.prisma.bodySpouse.findUnique({
      where: { bodyIdA_bodyIdB: { bodyIdA: pairA, bodyIdB: pairB } },
    });

    if (!relation) throw new NotFoundException('Spouse relationship not found');

    await this.prisma.bodySpouse.update({
      where: { id: relation.id },
      data: {
        status: dto.status,
        endDate: dto.endDate,
      },
    });

    this.eventEmitter.emit('tree-cache.invalidated', new TreeCacheInvalidatedEvent(actorId));

    return this.findById(id);
  }

  async removeSpouse(id: string, spouseId: string, actorId: string): Promise<void> {
    const [pairA, pairB] = id < spouseId ? [id, spouseId] : [spouseId, id];

    const relation = await this.prisma.bodySpouse.findUnique({
      where: { bodyIdA_bodyIdB: { bodyIdA: pairA, bodyIdB: pairB } },
    });

    if (!relation) throw new NotFoundException('Spouse relationship not found');

    await this.prisma.bodySpouse.delete({ where: { id: relation.id } });

    this.eventEmitter.emit('tree-cache.invalidated', new TreeCacheInvalidatedEvent(actorId));
  }

  async deleteBody(id: string, actorId: string): Promise<void> {
    const existing = await this.prisma.body.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Body not found');

    await this.prisma.$transaction(async (tx) => {
      if (existing.sex === Sex.MALE) {
        await tx.body.updateMany({
          where: { fatherId: id },
          data: { fatherId: null },
        });
      } else {
        await tx.body.updateMany({
          where: { motherId: id },
          data: { motherId: null },
        });
      }

      await tx.body.delete({ where: { id } });
    });

    this.eventEmitter.emit('tree-cache.invalidated', new TreeCacheInvalidatedEvent(actorId));
  }

  private async validateSpouseCount(bodyId: string, sex: Sex): Promise<void> {
    const maxSpouses = sex === Sex.FEMALE ? 1 : 4;

    const count = await this.prisma.bodySpouse.count({
      where: {
        OR: [{ bodyIdA: bodyId }, { bodyIdB: bodyId }],
      },
    });

    if (count >= maxSpouses) {
      const label = sex === Sex.FEMALE ? 'Females' : 'Males';
      throw new BadRequestException(
        `${label} cannot have more than ${maxSpouses} spouse(s)`,
      );
    }
  }
}
