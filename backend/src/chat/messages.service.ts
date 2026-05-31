import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { XP_EVENTS } from '../gamification/gamification.events';
import * as DOMPurify from 'isomorphic-dompurify';

const MSG_SELECT = {
  id: true,
  roomId: true,
  content: true,
  type: true,
  editedAt: true,
  deletedAt: true,
  createdAt: true,
  user: {
    select: { id: true, username: true, avatarUrl: true, level: true },
  },
  reactions: {
    select: { id: true, emoji: true, userId: true, user: { select: { username: true } } },
  },
};

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private events: EventEmitter2,
  ) {}

  async getMessages(roomId: string, userId: string, cursor?: string, limit = 50) {
    // Verify access
    const member = await this.prisma.chatRoomMember.findFirst({
      where: { roomId, userId },
    });
    const room = await this.prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException();
    if (room.type !== 'SQUARE' && !member) throw new ForbiddenException();

    const messages = await this.prisma.message.findMany({
      where: {
        roomId,
        deletedAt: null,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: MSG_SELECT,
    });

    return messages.reverse();
  }

  async createMessage(roomId: string, userId: string, dto: SendMessageDto) {
    const room = await this.prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException();

    if (room.type !== 'SQUARE') {
      const member = await this.prisma.chatRoomMember.findFirst({ where: { roomId, userId } });
      if (!member) throw new ForbiddenException();
    }

    const sanitized = DOMPurify.sanitize(dto.content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    if (!sanitized.trim()) throw new ForbiddenException('Пустое сообщение');

    const msg = await this.prisma.message.create({
      data: {
        roomId,
        userId,
        content: sanitized,
        type: dto.type ?? 'TEXT',
      },
      select: MSG_SELECT,
    });

    await this.prisma.chatRoom.update({ where: { id: roomId }, data: { updatedAt: new Date() } });

    if (dto.type !== 'SYSTEM') {
      this.events.emit(XP_EVENTS.MESSAGE_SENT, { userId, reason: 'MESSAGE_SENT' });
    }

    return msg;
  }

  async editMessage(messageId: string, userId: string, content: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException();
    if (msg.userId !== userId) throw new ForbiddenException();

    const sanitized = DOMPurify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

    return this.prisma.message.update({
      where: { id: messageId },
      data: { content: sanitized, editedAt: new Date() },
      select: MSG_SELECT,
    });
  }

  async deleteMessage(messageId: string, userId: string) {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { room: { include: { members: { where: { userId } } } } },
    });
    if (!msg) throw new NotFoundException();

    const isOwner = msg.userId === userId;
    const isMod = msg.room.members.some((m) => m.role === 'MOD' || m.role === 'ADMIN');

    if (!isOwner && !isMod) throw new ForbiddenException();

    return this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), content: '[удалено]' },
      select: MSG_SELECT,
    });
  }

  async toggleReaction(messageId: string, userId: string, emoji: string) {
    const existing = await this.prisma.messageReaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });

    if (existing) {
      await this.prisma.messageReaction.delete({ where: { id: existing.id } });
      return { added: false, emoji };
    }

    await this.prisma.messageReaction.create({ data: { messageId, userId, emoji } });
    return { added: true, emoji };
  }

  async getReactions(messageId: string) {
    const reactions = await this.prisma.messageReaction.findMany({
      where: { messageId },
      select: { emoji: true, userId: true, user: { select: { username: true } } },
    });

    // Group by emoji
    const grouped: Record<string, { count: number; users: string[] }> = {};
    for (const r of reactions) {
      if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, users: [] };
      grouped[r.emoji].count++;
      grouped[r.emoji].users.push(r.user.username);
    }
    return grouped;
  }
}
