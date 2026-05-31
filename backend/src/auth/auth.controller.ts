import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, accessToken, user } = await this.authService.register(dto);
    res.cookie('refresh_token', refreshToken, COOKIE_OPTIONS);
    return { accessToken, user };
  }

  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, accessToken, user } = await this.authService.login(dto);
    res.cookie('refresh_token', refreshToken, COOKIE_OPTIONS);
    return { accessToken, user };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request & { user: { sub: string; refreshToken: string } }, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.refresh(
      req.user.sub,
      req.user.refreshToken,
    );
    res.cookie('refresh_token', refreshToken, COOKIE_OPTIONS);
    return { accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request & { user: { id: string }; cookies: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req.user.id, req.cookies['refresh_token']);
    res.clearCookie('refresh_token', { path: '/' });
    return { ok: true };
  }
}
