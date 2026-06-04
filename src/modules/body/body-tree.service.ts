import { Injectable } from '@nestjs/common';
import { Body, BodyPhoto, BodySpouse, Sex } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService, CACHE_KEYS } from '../../core/redis/redis.service';
import { LoggerService } from '../../core/logger/logger.service';
import { MarriageNode, SpouseNode, TreeNode, TreeResponse } from './types/tree-node.type';

type BodyWithSpousesAndPhotos = Body & {
  photos: BodyPhoto[];
  spousesAsA: (BodySpouse & { bodyB: Body & { photos: BodyPhoto[] } })[];
  spousesAsB: (BodySpouse & { bodyA: Body & { photos: BodyPhoto[] } })[];
};

@Injectable()
export class BodyTreeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly logger: LoggerService,
  ) {}

  async getTree(depth: number): Promise<TreeResponse> {
    const cached = await this.redis.get<TreeNode>(CACHE_KEYS.FAMILY_TREE);

    if (cached) {
      const sliced = depth === 0 ? cached : this.sliceTreeByDepth(cached, depth);
      return { cached: true, tree: sliced };
    }

    const tree = await this.buildAndCacheTree();
    const sliced = depth === 0 ? tree : this.sliceTreeByDepth(tree, depth);
    return { cached: false, tree: sliced };
  }

  async buildAndCacheTree(): Promise<TreeNode> {
    const allBodies = await this.prisma.body.findMany({
      include: {
        photos: { orderBy: { position: 'asc' } },
        spousesAsA: { include: { bodyB: { include: { photos: { orderBy: { position: 'asc' } } } } } },
        spousesAsB: { include: { bodyA: { include: { photos: { orderBy: { position: 'asc' } } } } } },
      },
    });

    const bodyMap = new Map<string, BodyWithSpousesAndPhotos>();
    for (const body of allBodies) {
      bodyMap.set(body.id, body as BodyWithSpousesAndPhotos);
    }

    const roots = allBodies.filter(
      (b) => b.fatherId === null && b.motherId === null && b.sex === Sex.MALE,
    );

    const root =
      roots.length === 1
        ? roots[0]
        : roots.sort(
            (a, b) => new Date(a.dateOfBirth).getTime() - new Date(b.dateOfBirth).getTime(),
          )[0];

    if (!root) {
      throw new Error('No root body found (MALE with no parents)');
    }

    const tree = this.buildNode(
      bodyMap.get(root.id) as BodyWithSpousesAndPhotos,
      bodyMap,
      new Set<string>(),
    );

    await this.redis.set(CACHE_KEYS.FAMILY_TREE, tree);

    return tree;
  }

  buildNode(
    body: BodyWithSpousesAndPhotos,
    allBodies: Map<string, BodyWithSpousesAndPhotos>,
    visitedIds: Set<string>,
  ): TreeNode {
    if (visitedIds.has(body.id)) {
      return {
        id: body.id,
        fullname: body.fullname,
        photo: body.photos[0]?.url ?? null,
        sex: body.sex,
        isAlive: body.isAlive,
        maritalStatus: body.maritalStatus,
        marriages: [],
      };
    }

    visitedIds.add(body.id);

    const marriages: MarriageNode[] = [];

    const spouseRelations = [
      ...body.spousesAsA.map((rel) => ({
        id: rel.id,
        spouseBody: rel.bodyB as Body & { photos: BodyPhoto[] },
        status: rel.status,
        marriageDate: rel.marriageDate,
        endDate: rel.endDate,
        spouseId: rel.bodyIdB,
      })),
      ...body.spousesAsB.map((rel) => ({
        id: rel.id,
        spouseBody: rel.bodyA as Body & { photos: BodyPhoto[] },
        status: rel.status,
        marriageDate: rel.marriageDate,
        endDate: rel.endDate,
        spouseId: rel.bodyIdA,
      })),
    ];

    for (const rel of spouseRelations) {
      const spouse: SpouseNode = {
        id: rel.spouseBody.id,
        fullname: rel.spouseBody.fullname,
        photo: rel.spouseBody.photos[0]?.url ?? null,
        sex: rel.spouseBody.sex,
        isAlive: rel.spouseBody.isAlive,
        maritalStatus: rel.spouseBody.maritalStatus,
      };

      const children: TreeNode[] = [];

      for (const candidate of allBodies.values()) {
        const isChild =
          (candidate.fatherId === body.id && candidate.motherId === rel.spouseId) ||
          (candidate.motherId === body.id && candidate.fatherId === rel.spouseId);

        if (isChild) {
          const childNode = this.buildNode(candidate, allBodies, new Set(visitedIds));
          children.push(childNode);
        }
      }

      marriages.push({
        status: rel.status,
        marriageDate: rel.marriageDate,
        endDate: rel.endDate,
        spouse,
        children,
      });
    }

    return {
      id: body.id,
      fullname: body.fullname,
      photo: body.photos[0]?.url ?? null,
      sex: body.sex,
      isAlive: body.isAlive,
      maritalStatus: body.maritalStatus,
      marriages,
    };
  }

  sliceTreeByDepth(node: TreeNode, depth: number, current: number = 0): TreeNode {
    if (depth === 0) return node;

    if (current >= depth) {
      return { ...node, marriages: [] };
    }

    return {
      ...node,
      marriages: node.marriages.map((marriage) => ({
        ...marriage,
        children: marriage.children.map((child) =>
          this.sliceTreeByDepth(child, depth, current + 1),
        ),
      })),
    };
  }
}
