import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type AuthReq = { user: { id: string } };

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Get()
  getFriends(@Req() req: AuthReq) {
    return this.friendsService.getFriends(req.user.id);
  }

  @Get('requests')
  getRequests(@Req() req: AuthReq) {
    return this.friendsService.getPendingRequests(req.user.id);
  }

  @Post('request/:userId')
  sendRequest(@Req() req: AuthReq, @Param('userId') userId: string) {
    return this.friendsService.sendRequest(req.user.id, userId);
  }

  @Post('respond/:requestId')
  respond(
    @Req() req: AuthReq,
    @Param('requestId') requestId: string,
    @Body('accept') accept: boolean,
  ) {
    return this.friendsService.respond(req.user.id, requestId, accept);
  }

  @Delete(':friendId')
  removeFriend(@Req() req: AuthReq, @Param('friendId') friendId: string) {
    return this.friendsService.removeFriend(req.user.id, friendId);
  }
}
