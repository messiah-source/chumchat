import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { TagsService } from '../tags/tags.service';
import { CreateContestDto } from './dto/create-contest.dto';

const CONTEST_SELECT = {
  id: true,
  title: true,
  description: true,
  startAt: true,
  endAt: true,
  status: true,
  maxWinners: true,
  prizeXp: true,
  prizeCoins: true,
  createdBy: true,
  createdAt: true,
  prizeTag: { select: { id: true, name: true } },
  _count: { select: { entries: true } },
};

@Injectable()
export class ContestsService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
    private tagsService: TagsService,
  ) {}

  async list(status?: string) {
    return this.prisma.contest.findMany({
      where: status ? { status: status as 'PENDING' | 'ACTIVE' | 'FINISHED' } : undefined,
      select: CONTEST_SELECT,
      orderBy: { endAt: 'asc' },
    });
  }

  async get(contestId: string, userId?: string) {
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        prizeTag: { select: { id: true, name: true } },
        entries: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true, level: true } },
            _count: { select: { votes: true } },
          },
          orderBy: { votes: { _count: 'desc' } },
        },
      },
    });
    if (!contest) throw new NotFoundException();

    // Hydrate with user's vote if authenticated
    let myEntryId: string | null = null;
    let myVotedEntryId: string | null = null;

    if (userId) {
      const myEntry = contest.entries.find((e) => e.userId === userId);
      myEntryId = myEntry?.id ?? null;

      const myVote = await this.prisma.contestVote.findFirst({
        where: { contestId, voterId: userId },
      });
      myVotedEntryId = myVote?.entryId ?? null;
    }

    return { ...contest, myEntryId, myVotedEntryId };
  }

  async create(userId: string, dto: CreateContestDto) {
    let prizeTagId: string | undefined;
    if (dto.prizeTagName) {
      const tag = await this.prisma.tag.findFirst({
        where: { name: dto.prizeTagName.toLowerCase(), type: { in: ['UNIQUE', 'COMPETITIVE'] } },
      });
      if (!tag) throw new NotFoundException(`Тег "${dto.prizeTagName}" не найден или не уникальный`);
      prizeTagId = tag.id;
    }

    return this.prisma.contest.create({
      data: {
        title: dto.title,
        description: dto.description,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        maxWinners: dto.maxWinners ?? 1,
        prizeXp: dto.prizeXp ?? 200,
        prizeCoins: dto.prizeCoins ?? 100,
        prizeTagId,
        createdBy: userId,
        status: new Date(dto.startAt) <= new Date() ? 'ACTIVE' : 'PENDING',
      },
      select: CONTEST_SELECT,
    });
  }

  async enter(userId: string, contestId: string) {
    const contest = await this.prisma.contest.findUnique({ where: { id: contestId } });
    if (!contest) throw new NotFoundException();
    if (contest.status !== 'ACTIVE') {
      throw new BadRequestException('Конкурс не активен');
    }

    return this.prisma.contestEntry.upsert({
      where: { contestId_userId: { contestId, userId } },
      create: { contestId, userId },
      update: {},
    });
  }

  async vote(voterId: string, entryId: string) {
    const entry = await this.prisma.contestEntry.findUnique({
      where: { id: entryId },
      include: { contest: true },
    });
    if (!entry) throw new NotFoundException();
    if (entry.userId === voterId) throw new BadRequestException('Нельзя голосовать за себя');
    if (entry.contest.status !== 'ACTIVE') throw new BadRequestException('Конкурс не активен');

    const existing = await this.prisma.contestVote.findUnique({
      where: { contestId_voterId: { contestId: entry.contestId, voterId } },
    });
    if (existing) {
      if (existing.entryId === entryId) {
        await this.prisma.contestVote.delete({ where: { id: existing.id } });
        return { voted: false };
      }
      await this.prisma.contestVote.update({
        where: { id: existing.id },
        data: { entryId },
      });
      return { voted: true, changed: true };
    }

    await this.prisma.contestVote.create({
      data: { entryId, voterId, contestId: entry.contestId },
    });
    return { voted: true };
  }

  async finalize(contestId: string) {
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        entries: {
          include: { _count: { select: { votes: true } } },
          orderBy: { votes: { _count: 'desc' } },
        },
      },
    });
    if (!contest) throw new NotFoundException();
    if (contest.status === 'FINISHED') throw new BadRequestException('Уже завершён');

    await this.prisma.contest.update({
      where: { id: contestId },
      data: { status: 'FINISHED' },
    });

    const winners = contest.entries.slice(0, contest.maxWinners);

    for (const winner of winners) {
      if (contest.prizeXp) {
        await this.gamification.handleXpGain({
          userId: winner.userId,
          reason: 'MESSAGE_SENT',
          amount: contest.prizeXp,
        });
      }
      if (contest.prizeCoins) {
        await this.gamification.grantCoins(
          winner.userId,
          contest.prizeCoins,
          `Победа в конкурсе: ${contest.title}`,
        );
      }
      if (contest.prizeTagId) {
        const tag = await this.prisma.tag.findUnique({ where: { id: contest.prizeTagId } });
        if (tag) {
          await this.tagsService.grantTag(winner.userId, tag.name);
        }
      }
    }

    return { finalized: true, winners: winners.map((w) => w.userId) };
  }

  /** Cron: activate pending, finalize expired */
  @Cron(CronExpression.EVERY_MINUTE)
  async autoManageContests() {
    const now = new Date();

    await this.prisma.contest.updateMany({
      where: { status: 'PENDING', startAt: { lte: now } },
      data: { status: 'ACTIVE' },
    });

    const expired = await this.prisma.contest.findMany({
      where: { status: 'ACTIVE', endAt: { lte: now } },
      select: { id: true },
    });

    for (const c of expired) {
      await this.finalize(c.id).catch(() => null);
    }
  }
}
