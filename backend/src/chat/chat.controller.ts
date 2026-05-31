import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { MessagesService } from './messages.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type AuthReq = { user: { id: string } };

@Controller('chat')
export class ChatController {
  constructor(
    private roomsService: RoomsService,
    private messagesService: MessagesService,
  ) {}

  @Get('squares')
  getSquares() {
    return this.roomsService.getSquares();
  }

  @UseGuards(JwtAuthGuard)
  @Get('rooms')
  getMyRooms(@Req() req: AuthReq) {
    return this.roomsService.getUserRooms(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('rooms/:roomId')
  getRoom(@Req() req: AuthReq, @Param('roomId') roomId: string) {
    return this.roomsService.getRoom(roomId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('rooms')
  createRoom(@Req() req: AuthReq, @Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('rooms/:roomId/join')
  joinRoom(@Req() req: AuthReq, @Param('roomId') roomId: string) {
    return this.roomsService.joinRoom(req.user.id, roomId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('rooms/:roomId/leave')
  leaveRoom(@Req() req: AuthReq, @Param('roomId') roomId: string) {
    return this.roomsService.leaveRoom(req.user.id, roomId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('rooms/:roomId/messages')
  getMessages(
    @Req() req: AuthReq,
    @Param('roomId') roomId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagesService.getMessages(roomId, req.user.id, cursor, limit ? +limit : 50);
  }
}
