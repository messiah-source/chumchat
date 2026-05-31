import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TagType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';

const TAG_WEIGHTS: Record<TagType, number> = {
  FREE: 1,
  ACHIEVEMENT: 3,
  COMPETITIVE: 4,
  UNIQUE: 5,
};

// Tags that can never be self-applied
const SELF_APPLY_BLOCKED: TagType[] = ['UNIQUE', 'ACHIEVEMENT'];

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  /** Autocomplete — find tags by prefix (global pool) */
  async search(query: string, limit = 20) {
    const q = query.trim().toLowerCase();
    if (!q) return this.getPopular(limit);

    return this.prisma.tag.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
      take: limit,
      select: { id: true, name: true, type: true, maxCount: true, _count: { select: { users: true } } },
    });
  }

  /** Most-used free tags */
  async getPopular(limit = 30) {
    return this.prisma.tag.findMany({
      where: { type: 'FREE' },
      orderBy: { users: { _count: 'desc' } },
      take: limit,
      select: { id: true, name: true, type: true, _count: { select: { users: true } } },
    });
  }

  /** Add tag to current user. Creates tag if FREE and new to global pool. */
  async addTagToUser(userId: string, dto: CreateTagDto) {
    const normalizedName = dto.name.trim().toLowerCase();

    // Find or create tag (only FREE can be auto-created by users)
    let tag = await this.prisma.tag.findUnique({ where: { name: normalizedName } });

    if (!tag) {
      // Only FREE tags can be created by users
      const requestedType = dto.type ?? 'FREE';
      if (requestedType !== 'FREE') {
        throw new ForbiddenException('Нельзя создать тег этого типа вручную');
      }
      tag = await this.prisma.tag.create({
        data: { name: normalizedName, type: 'FREE' },
      });
    }

    // Block self-application of restricted types
    if (SELF_APPLY_BLOCKED.includes(tag.type)) {
      throw new ForbiddenException(`Тег "${tag.name}" можно получить только как награду`);
    }

    // Check UNIQUE tag capacity
    if (tag.type === 'UNIQUE' && tag.maxCount !== null) {
      const count = await this.prisma.userTag.count({ where: { tagId: tag.id } });
      if (count >= tag.maxCount) {
        throw new BadRequestException(`Уникальный тег "${tag.name}" уже получили ${tag.maxCount} человек`);
      }
    }

    // Check duplicate
    const existing = await this.prisma.userTag.findUnique({
      where: { userId_tagId: { userId, tagId: tag.id } },
    });
    if (existing) throw new BadRequestException('Тег уже добавлен');

    // Limit per user
    const userTagCount = await this.prisma.userTag.count({ where: { userId } });
    if (userTagCount >= 50) throw new BadRequestException('Максимум 50 тегов');

    await this.prisma.userTag.create({ data: { userId, tagId: tag.id } });
    return tag;
  }

  /** Remove tag from user */
  async removeTagFromUser(userId: string, tagId: string) {
    const ut = await this.prisma.userTag.findUnique({
      where: { userId_tagId: { userId, tagId } },
      include: { tag: true },
    });
    if (!ut) throw new NotFoundException('Тег не найден');

    // Block removal of non-free tags
    if (ut.tag.type !== 'FREE' && ut.tag.type !== 'COMPETITIVE') {
      throw new ForbiddenException('Этот тег нельзя снять');
    }

    await this.prisma.userTag.delete({ where: { userId_tagId: { userId, tagId } } });
    return { removed: true };
  }

  /** Grant achievement/unique tag by system (no restrictions) */
  async grantTag(userId: string, tagName: string) {
    const tag = await this.prisma.tag.findUnique({ where: { name: tagName } });
    if (!tag) throw new NotFoundException(`Тег "${tagName}" не найден`);

    await this.prisma.userTag.upsert({
      where: { userId_tagId: { userId, tagId: tag.id } },
      create: { userId, tagId: tag.id },
      update: {},
    });
    return tag;
  }

  /** Search users by tag names (AND logic — must have ALL listed tags) */
  async searchUsersByTags(tagNames: string[], limit = 20, offset = 0) {
    const tags = await this.prisma.tag.findMany({
      where: { name: { in: tagNames.map((t) => t.toLowerCase()) } },
      select: { id: true },
    });
    if (!tags.length) return { users: [], total: 0 };

    const tagIds = tags.map((t) => t.id);

    // Users who have ALL requested tags — use Prisma groupBy
    // (unique constraint on userId+tagId means count = distinct count)
    const grouped = await this.prisma.userTag.groupBy({
      by: ['userId'],
      where: { tagId: { in: tagIds } },
      _count: { tagId: true },
      having: { tagId: { _count: { equals: tagIds.length } } },
      orderBy: { _count: { tagId: 'desc' } },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.userTag.groupBy({
      by: ['userId'],
      where: { tagId: { in: tagIds } },
      _count: { tagId: true },
      having: { tagId: { _count: { equals: tagIds.length } } },
    });

    const ids = grouped.map((r) => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        level: true,
        xp: true,
        status: true,
        bio: true,
        tags: { include: { tag: true } },
        _count: { select: { receivedLikes: true } },
      },
    });

    // Preserve order from groupBy
    const orderedUsers = ids.map((id) => users.find((u) => u.id === id)!).filter(Boolean);

    return { users: orderedUsers, total: total.length };
  }

  /** Compatibility score between two users, 0-100 */
  async getCompatibility(userId1: string, userId2: string) {
    const [tags1, tags2] = await Promise.all([
      this.prisma.userTag.findMany({
        where: { userId: userId1 },
        include: { tag: { select: { id: true, name: true, type: true } } },
      }),
      this.prisma.userTag.findMany({
        where: { userId: userId2 },
        include: { tag: { select: { id: true, name: true, type: true } } },
      }),
    ]);

    const map1 = new Map(tags1.map((ut) => [ut.tagId, ut.tag]));
    const map2 = new Map(tags2.map((ut) => [ut.tagId, ut.tag]));

    // Intersection
    const matched: { name: string; type: TagType; weight: number }[] = [];
    for (const [tagId, tag] of map1) {
      if (map2.has(tagId)) {
        matched.push({ name: tag.name, type: tag.type, weight: TAG_WEIGHTS[tag.type] });
      }
    }

    // Max possible score = sum of max weights from both sets (union)
    const allIds = new Set([...map1.keys(), ...map2.keys()]);
    let maxScore = 0;
    for (const tagId of allIds) {
      const tag = map1.get(tagId) ?? map2.get(tagId)!;
      maxScore += TAG_WEIGHTS[tag.type];
    }

    const matchedScore = matched.reduce((acc, t) => acc + t.weight, 0);
    const percentage = maxScore === 0 ? 0 : Math.round((matchedScore / maxScore) * 100);

    return {
      score: percentage,
      matchedTags: matched.sort((a, b) => b.weight - a.weight),
      total1: tags1.length,
      total2: tags2.length,
      matched: matched.length,
    };
  }

  /** Multi-user compatibility (vs current user) */
  async getMultiCompatibility(currentUserId: string, targetUserIds: string[]) {
    return Promise.all(
      targetUserIds.map(async (targetId) => ({
        userId: targetId,
        ...(await this.getCompatibility(currentUserId, targetId)),
      })),
    );
  }
}
