import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import {
  XP_VALUES,
  XpPayload,
  AchievementCheckPayload,
  XP_EVENTS,
} from './gamification.events';

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  // ── XP ───────────────────────────────────────────────────────────────────

  @OnEvent('xp.*')
  async handleXpGain(payload: XpPayload) {
    const amount = payload.amount ?? XP_VALUES[payload.reason] ?? 1;
    if (!amount) return;

    await this.prisma.xpLog.create({
      data: { userId: payload.userId, amount, reason: payload.reason },
    });

    const user = await this.prisma.user.update({
      where: { id: payload.userId },
      data: { xp: { increment: amount } },
      select: { xp: true, level: true },
    });

    const newLevel = this.calculateLevel(user.xp);
    if (newLevel > user.level) {
      await this.prisma.user.update({
        where: { id: payload.userId },
        data: { level: newLevel },
      });
      await this.grantCoins(payload.userId, newLevel * 10, `Уровень ${newLevel}`);
    }
  }

  calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  xpForNextLevel(level: number): number {
    return level * level * 100;
  }

  async getXpHistory(userId: string, limit = 20) {
    return this.prisma.xpLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ── ACHIEVEMENTS ─────────────────────────────────────────────────────────

  async checkAndGrantAchievements(userId: string) {
    const [user, msgCount, likesCount, friendsCount, tagsCount, achievementIds] =
      await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
        this.prisma.message.count({ where: { userId, deletedAt: null } }),
        this.prisma.profileLike.count({ where: { receiverId: userId } }),
        this.prisma.friendship.count({ where: { OR: [{ userAId: userId }, { userBId: userId }] } }),
        this.prisma.userTag.count({ where: { userId } }),
        this.prisma.userAchievement.findMany({
          where: { userId },
          select: { achievementId: true },
        }).then((a) => new Set(a.map((x) => x.achievementId))),
      ]);

    const daysSinceJoin = user
      ? (Date.now() - user.createdAt.getTime()) / 86400000
      : 0;

    const counters: Record<string, number> = {
      messages_10:   msgCount,
      messages_100:  msgCount,
      messages_500:  msgCount,
      likes_10:      likesCount,
      likes_50:      likesCount,
      friends_5:     friendsCount,
      friends_20:    friendsCount,
      tags_5:        tagsCount,
      tags_10:       tagsCount,
      month_member:  daysSinceJoin,
    };

    const thresholds: Record<string, number> = {
      messages_10:  10,
      messages_100: 100,
      messages_500: 500,
      likes_10:     10,
      likes_50:     50,
      friends_5:    5,
      friends_20:   20,
      tags_5:       5,
      tags_10:      10,
      month_member: 30,
    };

    const achievements = await this.prisma.achievement.findMany({
      where: { trigger: { in: Object.keys(counters) } },
    });

    for (const ach of achievements) {
      if (!ach.trigger || achievementIds.has(ach.id)) continue;
      const threshold = thresholds[ach.trigger] ?? ach.triggerValue;
      if (threshold && counters[ach.trigger] >= threshold) {
        await this.grantAchievement(userId, ach.id);
      }
    }
  }

  async grantAchievement(userId: string, achievementId: string) {
    const existing = await this.prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId } },
    });
    if (existing) return null;

    const ach = await this.prisma.achievement.findUnique({ where: { id: achievementId } });
    if (!ach) return null;

    await this.prisma.userAchievement.create({ data: { userId, achievementId } });

    if (ach.xpReward) {
      await this.handleXpGain({ userId, reason: 'MESSAGE_SENT', amount: ach.xpReward });
    }
    if (ach.coinsReward) {
      await this.grantCoins(userId, ach.coinsReward, `Ачивка: ${ach.name}`);
    }

    return ach;
  }

  // ── DAILY LOGIN ──────────────────────────────────────────────────────────

  async processDailyLogin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lastLoginAt: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isFirstToday = !user?.lastLoginAt || user.lastLoginAt < today;

    if (isFirstToday) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() },
      });
      await this.handleXpGain({ userId, reason: 'DAILY_LOGIN' });
      await this.grantCoins(userId, 5, 'Ежедневный вход');
      return { bonus: true, xp: XP_VALUES.DAILY_LOGIN, coins: 5 };
    }
    return { bonus: false };
  }

  // ── COINS ────────────────────────────────────────────────────────────────

  async grantCoins(userId: string, amount: number, description: string) {
    await this.prisma.userBalance.upsert({
      where: { userId },
      create: { userId, coins: amount },
      update: { coins: { increment: amount } },
    });
    await this.prisma.transaction.create({
      data: { userId, amount, type: 'GRANT', description },
    });
  }

  async getBalance(userId: string) {
    const bal = await this.prisma.userBalance.findUnique({ where: { userId } });
    return { coins: bal?.coins ?? 0 };
  }

  async getLeaderboardXp(limit = 20) {
    return this.prisma.user.findMany({
      orderBy: [{ level: 'desc' }, { xp: 'desc' }],
      take: limit,
      select: {
        id: true, username: true, avatarUrl: true,
        level: true, xp: true, status: true,
        _count: { select: { receivedLikes: true } },
      },
    });
  }
}
