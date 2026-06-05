import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { PurchaseDto } from './dto/purchase.dto';
import { EquipDto } from './dto/equip.dto';

@Injectable()
export class ShopService {
  constructor(
    private prisma: PrismaService,
    private events: EventEmitter2,
  ) {}

  async getCatalog(type?: string) {
    return this.prisma.shopItem.findMany({
      where: {
        isActive: true,
        ...(type ? { type: type as 'SKIN' | 'DECORATION' | 'TAG' | 'BADGE' } : {}),
      },
      include: { tag: { select: { id: true, name: true, type: true } } },
      orderBy: [{ rarity: 'asc' }, { price: 'asc' }],
    });
  }

  async getInventory(userId: string) {
    return this.prisma.userInventory.findMany({
      where: { userId },
      include: { item: { include: { tag: true } } },
      orderBy: { purchasedAt: 'desc' },
    });
  }

  async purchase(userId: string, dto: PurchaseDto) {
    const item = await this.prisma.shopItem.findUnique({
      where: { id: dto.itemId, isActive: true },
    });
    if (!item) throw new NotFoundException('Товар не найден');

    const alreadyOwns = await this.prisma.userInventory.findUnique({
      where: { userId_itemId: { userId, itemId: dto.itemId } },
    });
    if (alreadyOwns) throw new ConflictException('Уже куплено');

    const balance = await this.prisma.userBalance.findUnique({ where: { userId } });
    const coins = balance?.coins ?? 0;
    if (coins < item.price) {
      throw new BadRequestException(`Не хватает монет. Нужно: ${item.price}, есть: ${coins}`);
    }

    const [, inv] = await this.prisma.$transaction([
      this.prisma.userBalance.update({
        where: { userId },
        data: { coins: { decrement: item.price } },
      }),
      this.prisma.userInventory.create({
        data: { userId, itemId: dto.itemId },
        include: { item: { include: { tag: true } } },
      }),
      this.prisma.transaction.create({
        data: {
          userId,
          amount: -item.price,
          type: 'PURCHASE',
          description: `Покупка: ${item.name}`,
        },
      }),
    ]);

    // Grant TAG if item is of type TAG
    if (item.type === 'TAG' && item.tagId) {
      await this.prisma.userTag.upsert({
        where: { userId_tagId: { userId, tagId: item.tagId } },
        create: { userId, tagId: item.tagId },
        update: {},
      });
    }

    return inv;
  }

  async equip(userId: string, dto: EquipDto) {
    const inv = await this.prisma.userInventory.findUnique({
      where: { id: dto.inventoryId },
      include: { item: true },
    });
    if (!inv || inv.userId !== userId) throw new NotFoundException();

    const field = dto.slot === 'skin' ? 'equippedSkin' : 'equippedFrame';
    const currentEquipped = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { [field]: true },
    });

    // Unequip old
    if ((currentEquipped as any)?.[field]) {
      await this.prisma.userInventory.updateMany({
        where: { userId, item: { type: dto.slot === 'skin' ? 'SKIN' : 'DECORATION' } },
        data: { isEquipped: false },
      });
    }

    await this.prisma.userInventory.update({
      where: { id: dto.inventoryId },
      data: { isEquipped: true },
    });

    return this.prisma.user.update({
      where: { id: userId },
      data: { [field]: inv.itemId },
      select: { id: true, equippedSkin: true, equippedFrame: true },
    });
  }

  async unequip(userId: string, slot: 'skin' | 'frame') {
    const field = slot === 'skin' ? 'equippedSkin' : 'equippedFrame';
    await this.prisma.userInventory.updateMany({
      where: { userId, item: { type: slot === 'skin' ? 'SKIN' : 'DECORATION' } },
      data: { isEquipped: false },
    });
    return this.prisma.user.update({
      where: { id: userId },
      data: { [field]: null },
      select: { id: true },
    });
  }

  async getTransactions(userId: string, limit = 30) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
