import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type AuthReq = { user: { id: string } };

@Controller('gamification')
export class GamificationController {
  constructor(private gService: GamificationService) {}

  @Get('leaderboard')
  getLeaderboard() {
    return this.gService.getLeaderboardXp();
  }

  @UseGuards(JwtAuthGuard)
  @Get('balance')
  getBalance(@Req() req: AuthReq) {
    return this.gService.getBalance(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('xp-history')
  getXpHistory(@Req() req: AuthReq) {
    return this.gService.getXpHistory(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('daily-login')
  dailyLogin(@Req() req: AuthReq) {
    return this.gService.processDailyLogin(req.user.id);
  }
}
