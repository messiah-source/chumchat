import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RateProfileDto } from './dto/rate-profile.dto';
import { XP_EVENTS } from '../gamification/gamification.events';

const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  avatarUrl: true,
  bannerUrl: true,
  bio: true,
  xp: true,
  level: true,
  status: true,
  theme: true,
  createdAt: true,
  achievements: {
    include: { achievement: true },
    orderBy: { earnedAt: 'desc' as const },
    take: 10,
  },
  tags: {
    include: { tag: true },
    orderBy: { addedAt: 'desc' as const },
  },
  _count: {
    select: { receivedLikes: true, receivedRatings: true },
  },
};

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private events: EventEmitter2,
  ) {}

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: PUBLIC_USER_SELECT,
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const avgRating = await this.prisma.profileRating.aggregate({
      where: { receiverId: user.id },
      _avg: { score: true },
    });

    return { ...user, avgRating: avgRating._avg.score };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: PUBLIC_USER_SELECT,
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
    const avgRating = await this.prisma.profileRating.aggregate({
      where: { receiverId: id },
      _avg: { score: true },
    });
    return { ...user, avgRating: avgRating._avg.score };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: { id: true, username: true, bio: true, theme: true, avatarUrl: true, bannerUrl: true },
    });
  }

  async updateAvatar(userId: string, filename: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: `/uploads/avatars/${filename}` },
      select: { id: true, avatarUrl: true },
    });
  }

  async updateBanner(userId: string, filename: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { bannerUrl: `/uploads/banners/${filename}` },
      select: { id: true, bannerUrl: true },
    });
  }

  async toggleLike(giverId: string, receiverId: string) {
    if (giverId === receiverId) throw new BadRequestException('Нельзя лайкнуть себя');

    const exists = await this.prisma.profileLike.findUnique({
      where: { giverId_receiverId: { giverId, receiverId } },
    });

    if (exists) {
      await this.prisma.profileLike.delete({
        where: { giverId_receiverId: { giverId, receiverId } },
      });
      return { liked: false };
    }

    await this.prisma.profileLike.create({ data: { giverId, receiverId } });
    await this.addXp(receiverId, 5);
    this.events.emit(XP_EVENTS.LIKE_RECEIVED, { userId: receiverId, reason: 'LIKE_RECEIVED' });
    return { liked: true };
  }

  async rateProfile(giverId: string, receiverId: string, dto: RateProfileDto) {
    if (giverId === receiverId) throw new BadRequestException('Нельзя оценить себя');

    const rating = await this.prisma.profileRating.upsert({
      where: { giverId_receiverId: { giverId, receiverId } },
      create: { giverId, receiverId, score: dto.score, comment: dto.comment },
      update: { score: dto.score, comment: dto.comment },
    });
    return rating;
  }

  async getTopProfiles(limit = 20) {
    const users = await this.prisma.user.findMany({
      orderBy: [{ level: 'desc' }, { xp: 'desc' }],
      take: limit,
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        level: true,
        xp: true,
        status: true,
        _count: { select: { receivedLikes: true } },
      },
    });
    return users;
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bannerUrl: true,
        bio: true,
        xp: true,
        level: true,
        status: true,
        theme: true,
        achievements: { include: { achievement: true } },
        tags: { include: { tag: true } },
        _count: { select: { receivedLikes: true } },
      },
    });
    if (!user) throw new NotFoundException();
    return user;
  }

  private async addXp(userId: string, amount: number) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: amount } },
      select: { xp: true, level: true },
    });

    const newLevel = Math.floor(Math.sqrt(user.xp / 100)) + 1;
    if (newLevel > user.level) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { level: newLevel },
      });
    }
  }
}
