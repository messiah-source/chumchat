import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ContestsService } from './contests.service';
import { CreateContestDto } from './dto/create-contest.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type AuthReq = { user: { id: string } };

@Controller('contests')
export class ContestsController {
  constructor(private contestsService: ContestsService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.contestsService.list(status);
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() req: { user?: { id: string } }) {
    return this.contestsService.get(id, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: AuthReq, @Body() dto: CreateContestDto) {
    return this.contestsService.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/enter')
  enter(@Req() req: AuthReq, @Param('id') id: string) {
    return this.contestsService.enter(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('entries/:entryId/vote')
  vote(@Req() req: AuthReq, @Param('entryId') entryId: string) {
    return this.contestsService.vote(req.user.id, entryId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/finalize')
  finalize(@Param('id') id: string) {
    return this.contestsService.finalize(id);
  }
}
