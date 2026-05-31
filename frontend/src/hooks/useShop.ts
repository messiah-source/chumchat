import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopApi } from '../api/shop';

export function useShopCatalog(type?: string) {
  return useQuery({
    queryKey: ['shop-catalog', type],
    queryFn: () => shopApi.getCatalog(type),
    staleTime: 60_000,
  });
}

export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: shopApi.getInventory,
    staleTime: 30_000,
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: shopApi.getTransactions,
    staleTime: 30_000,
  });
}

export function usePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => shopApi.purchase(itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useEquip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ inventoryId, slot }: { inventoryId: string; slot: 'skin' | 'frame' }) =>
      shopApi.equip(inventoryId, slot),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
