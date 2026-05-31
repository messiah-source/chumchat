import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { RoomType, MemberRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';

const ROOM_SELECT = {
  id: true,
  name: true,
  description: true,
  type: true,
  isEphemeral: true,
  creatorId: true,
  createdAt: true,
  tags: { include: { tag: { select: { id: true, name: true, type: true } } } },
  _count: { select: { members: true, messages: true } },
};

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async getSquares() {
    return this.prisma.chatRoom.findMany({
      where: { type: RoomType.SQUARE, isEphemeral: false },
      select: ROOM_SELECT,
      orderBy: { messages: { _count: 'desc' } },
    });
  }

  async getUserRooms(userId: string) {
    const memberships = await this.prisma.chatRoomMember.findMany({
      where: { userId },
      include: {
        room: {
          select: {
            ...ROOM_SELECT,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { content: true, createdAt: true, user: { select: { username: true } } },
            },
          },
        },
      },
      orderBy: { room: { updatedAt: 'desc' } },
    });
    return memberships.map((m) => ({ ...m.room, role: m.role, lastRead: m.lastRead }));
  }

  async getRoom(roomId: string, userId: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        tags: { include: { tag: true } },
        members: {
          include: { user: { select: { id: true, username: true, avatarUrl: true, status: true, level: true } } },
        },
      },
    });
    if (!room) throw new NotFoundException('Комната не найдена');

    // Access check
    if (room.type !== RoomType.SQUARE) {
      const member = room.members.find((m) => m.userId === userId);
      if (!member) throw new ForbiddenException('Нет доступа');
    }
    return room;
  }

  async createRoom(userId: string, dto: CreateRoomDto) {
    // DM: check no existing DM with same members
    if (dto.type === RoomType.DM && dto.memberIds?.length) {
      const allIds = [...new Set([userId, ...dto.memberIds])].sort();
      if (allIds.length === 2) {
        // Find DM rooms where both users are members, then filter to exactly 2 members
        const candidates = await this.prisma.chatRoom.findMany({
          where: {
            type: RoomType.DM,
            members: { some: { userId: allIds[0] } },
          },
          include: { members: { select: { userId: true } } },
        });
        const existing = candidates.find(
          (r) =>
            r.members.length === 2 &&
            r.members.every((m) => allIds.includes(m.userId)),
        );
        if (existing) return existing;
      }
    }

    const tagIds: string[] = [];
    if (dto.tagNames?.length) {
      const tags = await this.prisma.tag.findMany({
        where: { name: { in: dto.tagNames.map((t) => t.toLowerCase()) } },
      });
      tagIds.push(...tags.map((t) => t.id));
    }

    const memberIds = [...new Set([userId, ...(dto.memberIds ?? [])])];

    return this.prisma.chatRoom.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        creatorId: userId,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
        members: {
          create: memberIds.map((uid) => ({
            userId: uid,
            role: uid === userId ? MemberRole.ADMIN : MemberRole.MEMBER,
          })),
        },
      },
      include: { tags: { include: { tag: true } } },
    });
  }

  async joinRoom(userId: string, roomId: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { tags: { include: { tag: true } } },
    });
    if (!room) throw new NotFoundException();
    if (room.type === RoomType.DM) throw new ForbiddenException('Нельзя войти в личный чат напрямую');

    // Tag filter for groups
    if (room.type === RoomType.GROUP && room.tags.length > 0) {
      const requiredTagIds = room.tags.map((rt) => rt.tagId);
      const userTagCount = await this.prisma.userTag.count({
        where: { userId, tagId: { in: requiredTagIds } },
      });
      if (userTagCount === 0) {
        throw new ForbiddenException('Нужен хотя бы один из тегов группы');
      }
    }

    const existing = await this.prisma.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (existing) return existing;

    return this.prisma.chatRoomMember.create({
      data: { roomId, userId, role: MemberRole.MEMBER },
    });
  }

  async leaveRoom(userId: string, roomId: string) {
    const member = await this.prisma.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!member) throw new NotFoundException();
    if (member.role === MemberRole.ADMIN) {
      const otherAdmin = await this.prisma.chatRoomMember.findFirst({
        where: { roomId, userId: { not: userId }, role: MemberRole.ADMIN },
      });
      if (!otherAdmin) {
        const nextMod = await this.prisma.chatRoomMember.findFirst({
          where: { roomId, userId: { not: userId } },
          orderBy: { joinedAt: 'asc' },
        });
        if (nextMod) {
          await this.prisma.chatRoomMember.update({
            where: { id: nextMod.id },
            data: { role: MemberRole.ADMIN },
          });
        }
      }
    }
    await this.prisma.chatRoomMember.delete({ where: { id: member.id } });
    return { left: true };
  }

  async updateLastRead(userId: string, roomId: string) {
    return this.prisma.chatRoomMember.updateMany({
      where: { userId, roomId },
      data: { lastRead: new Date() },
    });
  }

  async getRoomForEphemeralPrivate(userId1: string, userId2: string, squareId: string) {
    const name = `private:${[userId1, userId2].sort().join(':')}@${squareId}`;
    let room = await this.prisma.chatRoom.findFirst({ where: { name, type: RoomType.DM, isEphemeral: true } });
    if (!room) {
      room = await this.prisma.chatRoom.create({
        data: {
          name,
          type: RoomType.DM,
          isEphemeral: true,
          members: { create: [{ userId: userId1 }, { userId: userId2 }] },
        },
      });
    }
    return room;
  }

  async setMemberRole(actorId: string, roomId: string, targetUserId: string, role: MemberRole) {
    const actor = await this.prisma.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId, userId: actorId } },
    });
    if (!actor || actor.role !== MemberRole.ADMIN) throw new ForbiddenException('Нужны права администратора');

    return this.prisma.chatRoomMember.updateMany({
      where: { roomId, userId: targetUserId },
      data: { role },
    });
  }
}
