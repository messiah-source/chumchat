import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  async sendRequest(requesterId: string, requestedId: string) {
    if (requesterId === requestedId) throw new BadRequestException('Нельзя добавить себя');

    const exists = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: requesterId, userBId: requestedId },
          { userAId: requestedId, userBId: requesterId },
        ],
      },
    });
    if (exists) throw new ConflictException('Уже в друзьях');

    return this.prisma.friendRequest.upsert({
      where: { requesterId_requestedId: { requesterId, requestedId } },
      create: { requesterId, requestedId },
      update: { status: 'PENDING' },
    });
  }

  async respond(userId: string, requestId: string, accept: boolean) {
    const req = await this.prisma.friendRequest.findFirst({
      where: { id: requestId, requestedId: userId, status: 'PENDING' },
    });
    if (!req) throw new NotFoundException();

    await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: accept ? 'ACCEPTED' : 'REJECTED' },
    });

    if (accept) {
      await this.prisma.friendship.upsert({
        where: { userAId_userBId: { userAId: req.requesterId, userBId: userId } },
        create: { userAId: req.requesterId, userBId: userId },
        update: {},
      });
    }

    return { accepted: accept };
  }

  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: { select: { id: true, username: true, avatarUrl: true, status: true, level: true } },
        userB: { select: { id: true, username: true, avatarUrl: true, status: true, level: true } },
      },
    });
    return friendships.map((f) => (f.userAId === userId ? f.userB : f.userA));
  }

  async getPendingRequests(userId: string) {
    return this.prisma.friendRequest.findMany({
      where: { requestedId: userId, status: 'PENDING' },
      include: {
        requester: { select: { id: true, username: true, avatarUrl: true, level: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeFriend(userId: string, friendId: string) {
    await this.prisma.friendship.deleteMany({
      where: {
        OR: [
          { userAId: userId, userBId: friendId },
          { userAId: friendId, userBId: userId },
        ],
      },
    });
    return { removed: true };
  }

  async areFriends(userId: string, otherId: string): Promise<boolean> {
    const f = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: otherId },
          { userAId: otherId, userBId: userId },
        ],
      },
    });
    return !!f;
  }
}
