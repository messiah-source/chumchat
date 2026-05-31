import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { RoomsService } from './rooms.service';
import { MessagesService } from './messages.service';

@Module({
  imports: [JwtModule.register({})],
  providers: [ChatGateway, RoomsService, MessagesService],
  controllers: [ChatController],
  exports: [RoomsService, MessagesService, ChatGateway],
})
export class ChatModule {}
