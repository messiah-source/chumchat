import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from './messages.service';
import { RoomsService } from './rooms.service';

interface AuthSocket extends Socket {
  data: { userId: string; username: string };
}

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private typingTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
    private messagesService: MessagesService,
    private roomsService: RoomsService,
  ) {}

  async handleConnection(socket: AuthSocket) {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) throw new Error('No token');

      const payload = this.jwt.verify(token, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
      }) as { sub: string; username: string };

      socket.data = { userId: payload.sub, username: payload.username };

      // Personal room for direct events
      socket.join(`user:${payload.sub}`);

      // Mark online
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { status: 'ONLINE' },
      });

      // Auto-join user's rooms
      const memberships = await this.prisma.chatRoomMember.findMany({
        where: { userId: payload.sub },
        select: { roomId: true },
      });
      for (const m of memberships) socket.join(`room:${m.roomId}`);

      // Broadcast online status
      this.server.emit('user_status', { userId: payload.sub, status: 'ONLINE' });
    } catch {
      socket.disconnect();
    }
  }

  async handleDisconnect(socket: AuthSocket) {
    if (!socket.data?.userId) return;
    const { userId } = socket.data;

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'OFFLINE' },
    }).catch(() => null);

    this.server.emit('user_status', { userId, status: 'OFFLINE' });
  }

  // ── JOIN / LEAVE ─────────────────────────────────────────────────────────

  @SubscribeMessage('join_room')
  async handleJoin(@ConnectedSocket() socket: AuthSocket, @MessageBody() data: { roomId: string }) {
    const { userId, username } = socket.data;
    const wasAlreadyInRoom = socket.rooms.has(`room:${data.roomId}`);
    await this.roomsService.joinRoom(userId, data.roomId);
    socket.join(`room:${data.roomId}`);

    if (!wasAlreadyInRoom) {
      const sysMsg = await this.messagesService.createMessage(data.roomId, userId, {
        content: `${username} вошёл в чат`,
        type: 'SYSTEM',
      });
      this.server.to(`room:${data.roomId}`).emit('new_message', sysMsg);
    }

    await this.roomsService.updateLastRead(userId, data.roomId);
    return { ok: true };
  }

  @SubscribeMessage('leave_room')
  async handleLeave(@ConnectedSocket() socket: AuthSocket, @MessageBody() data: { roomId: string }) {
    const { userId } = socket.data;
    socket.leave(`room:${data.roomId}`);
    await this.roomsService.leaveRoom(userId, data.roomId);
    return { ok: true };
  }

  // ── MESSAGES ─────────────────────────────────────────────────────────────

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() socket: AuthSocket,
    @MessageBody() data: { roomId: string; content: string },
  ) {
    const { userId } = socket.data;
    if (!data.content?.trim()) return;

    const msg = await this.messagesService.createMessage(data.roomId, userId, {
      content: data.content,
    });

    this.server.to(`room:${data.roomId}`).emit('new_message', msg);

    // Clear typing for this user
    this.clearTyping(data.roomId, socket.data.username);

    await this.roomsService.updateLastRead(userId, data.roomId);
    return msg;
  }

  @SubscribeMessage('edit_message')
  async handleEdit(
    @ConnectedSocket() socket: AuthSocket,
    @MessageBody() data: { messageId: string; content: string },
  ) {
    const { userId } = socket.data;
    const msg = await this.messagesService.editMessage(data.messageId, userId, data.content);
    const roomId = msg.roomId;
    this.server.to(`room:${roomId}`).emit('message_edited', msg);
    return msg;
  }

  @SubscribeMessage('delete_message')
  async handleDelete(
    @ConnectedSocket() socket: AuthSocket,
    @MessageBody() data: { messageId: string },
  ) {
    const { userId } = socket.data;
    const msg = await this.messagesService.deleteMessage(data.messageId, userId);
    this.server.to(`room:${msg.roomId}`).emit('message_deleted', { messageId: data.messageId, roomId: msg.roomId });
    return { ok: true };
  }

  // ── REACTIONS ────────────────────────────────────────────────────────────

  @SubscribeMessage('toggle_reaction')
  async handleReaction(
    @ConnectedSocket() socket: AuthSocket,
    @MessageBody() data: { messageId: string; emoji: string; roomId: string },
  ) {
    const { userId } = socket.data;
    const result = await this.messagesService.toggleReaction(data.messageId, userId, data.emoji);
    const grouped = await this.messagesService.getReactions(data.messageId);

    this.server.to(`room:${data.roomId}`).emit('reaction_updated', {
      messageId: data.messageId,
      reactions: grouped,
    });
    return result;
  }

  // ── TYPING ───────────────────────────────────────────────────────────────

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() socket: AuthSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { username } = socket.data;
    const key = `${data.roomId}:${username}`;

    // Clear old timer
    if (this.typingTimers.has(key)) clearTimeout(this.typingTimers.get(key));

    socket.to(`room:${data.roomId}`).emit('typing', { username, typing: true, roomId: data.roomId });

    // Auto-clear after 4s
    this.typingTimers.set(
      key,
      setTimeout(() => {
        socket.to(`room:${data.roomId}`).emit('typing', { username, typing: false, roomId: data.roomId });
        this.typingTimers.delete(key);
      }, 4000),
    );
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() socket: AuthSocket,
    @MessageBody() data: { roomId: string },
  ) {
    this.clearTyping(data.roomId, socket.data.username);
    socket.to(`room:${data.roomId}`).emit('typing', {
      username: socket.data.username,
      typing: false,
      roomId: data.roomId,
    });
  }

  // ── STATUS ───────────────────────────────────────────────────────────────

  @SubscribeMessage('set_status')
  async handleSetStatus(
    @ConnectedSocket() socket: AuthSocket,
    @MessageBody() data: { status: 'ONLINE' | 'OFFLINE' | 'AFK' },
  ) {
    const { userId } = socket.data;
    await this.prisma.user.update({ where: { id: userId }, data: { status: data.status } });
    this.server.emit('user_status', { userId, status: data.status });
    return { ok: true };
  }

  // ── EPHEMERAL PRIVATE ────────────────────────────────────────────────────

  @SubscribeMessage('start_private')
  async handleStartPrivate(
    @ConnectedSocket() socket: AuthSocket,
    @MessageBody() data: { targetUserId: string; squareId: string },
  ) {
    const { userId } = socket.data;
    const room = await this.roomsService.getRoomForEphemeralPrivate(userId, data.targetUserId, data.squareId);

    socket.join(`room:${room.id}`);
    this.server.to(`user:${data.targetUserId}`).emit('private_invite', {
      roomId: room.id,
      fromUserId: userId,
      fromUsername: socket.data.username,
    });

    return { roomId: room.id };
  }

  // ── HELPERS ──────────────────────────────────────────────────────────────

  broadcastToRoom(roomId: string, event: string, data: unknown) {
    this.server.to(`room:${roomId}`).emit(event, data);
  }

  private clearTyping(roomId: string, username: string) {
    const key = `${roomId}:${username}`;
    if (this.typingTimers.has(key)) {
      clearTimeout(this.typingTimers.get(key));
      this.typingTimers.delete(key);
    }
  }
}
