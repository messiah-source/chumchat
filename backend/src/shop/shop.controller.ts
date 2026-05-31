import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ShopService } from './shop.service';
import { PurchaseDto } from './dto/purchase.dto';
import { EquipDto } from './dto/equip.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type AuthReq = { user: { id: string } };

@Controller('shop')
export class ShopController {
  constructor(private shopService: ShopService) {}

  @Get('catalog')
  getCatalog(@Query('type') type?: string) {
    return this.shopService.getCatalog(type);
  }

  @UseGuards(JwtAuthGuard)
  @Get('inventory')
  getInventory(@Req() req: AuthReq) {
    return this.shopService.getInventory(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  getTransactions(@Req() req: AuthReq) {
    return this.shopService.getTransactions(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('buy')
  purchase(@Req() req: AuthReq, @Body() dto: PurchaseDto) {
    return this.shopService.purchase(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('equip')
  equip(@Req() req: AuthReq, @Body() dto: EquipDto) {
    return this.shopService.equip(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('unequip/:slot')
  unequip(@Req() req: AuthReq, @Param('slot') slot: 'skin' | 'frame') {
    return this.shopService.unequip(req.user.id, slot);
  }
}
