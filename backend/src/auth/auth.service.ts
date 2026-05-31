import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (exists) {
      const field = exists.email === dto.email ? 'email' : 'username';
      throw new ConflictException(`${field} уже занят`);
    }

    const hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email: dto.email, username: dto.username, password: hash },
      select: { id: true, username: true, email: true, level: true, xp: true, avatarUrl: true },
    });

    await this.grantFirstLoginAchievement(user.id);

    const tokens = await this.issueTokens(user.id, user.username);
    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.login }, { username: dto.login }],
      },
    });
    if (!user) throw new UnauthorizedException('Неверный логин или пароль');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Неверный логин или пароль');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { status: 'ONLINE' },
    });

    const tokens = await this.issueTokens(user.id, user.username);
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        level: user.level,
        xp: user.xp,
        avatarUrl: user.avatarUrl,
        status: 'ONLINE',
      },
      ...tokens,
    };
  }

  async refresh(userId: string, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId, tokenHash, expiresAt: { gt: new Date() } },
    });
    if (!stored) throw new UnauthorizedException('Сессия истекла');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });
    if (!user) throw new UnauthorizedException();

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.issueTokens(user.id, user.username);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.deleteMany({ where: { userId, tokenHash } });
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'OFFLINE' },
    });
  }

  private async issueTokens(userId: string, username: string) {
    const payload = { sub: userId, username };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES') || '15m',
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES') || '7d',
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async grantFirstLoginAchievement(userId: string) {
    const achievement = await this.prisma.achievement.findFirst({
      where: { trigger: 'first_login' },
    });
    if (!achievement) return;
    await this.prisma.userAchievement.create({
      data: { userId, achievementId: achievement.id },
    }).catch(() => null);
    await this.prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: achievement.xpReward } },
    });
  }
}
