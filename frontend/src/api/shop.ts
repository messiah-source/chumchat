import { api } from './client';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: 'SKIN' | 'DECORATION' | 'TAG' | 'BADGE';
  price: number;
  imageUrl: string | null;
  data: Record<string, string>;
  isActive: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  tag?: { id: string; name: string; type: string } | null;
}

export interface InventoryItem {
  id: string;
  itemId: string;
  isEquipped: boolean;
  purchasedAt: string;
  item: ShopItem;
}

export interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export const shopApi = {
  getCatalog: (type?: string) =>
    api.get<ShopItem[]>('/shop/catalog', { params: type ? { type } : {} }).then((r) => r.data),

  getInventory: () =>
    api.get<InventoryItem[]>('/shop/inventory').then((r) => r.data),

  getTransactions: () =>
    api.get<Transaction[]>('/shop/transactions').then((r) => r.data),

  purchase: (itemId: string) =>
    api.post<InventoryItem>('/shop/buy', { itemId }).then((r) => r.data),

  equip: (inventoryId: string, slot: 'skin' | 'frame') =>
    api.post('/shop/equip', { inventoryId, slot }).then((r) => r.data),

  unequip: (slot: 'skin' | 'frame') =>
    api.post(`/shop/unequip/${slot}`).then((r) => r.data),
};
