import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useShopCatalog, useInventory, usePurchase, useEquip } from '../hooks/useShop';
import { useGamification, useDailyLogin } from '../hooks/useContests';
import { useAuthStore } from '../store/authStore';
import { ChumLogo } from '../components/layout/ChumLogo';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ShopItemCard } from '../components/shop/ShopItemCard';
import { AchievementToast } from '../components/gamification/AchievementToast';
import type { ShopItem } from '../api/shop';

type Filter = 'ALL' | 'SKIN' | 'DECORATION' | 'TAG' | 'BADGE';

const FILTER_LABELS: Record<Filter, string> = {
  ALL: '🛒 Всё',
  SKIN: '🎨 Скины',
  DECORATION: '🖼 Рамки',
  TAG: '🏷 Теги',
  BADGE: '🏅 Значки',
};

export default function Shop() {
  const { isAuthenticated } = useAuthStore();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [toast, setToast] = useState<null | { name: string; icon: string; description: string; xpReward: number }>(null);
  const [buySuccess, setBuySuccess] = useState<string | null>(null);

  const { data: catalog = [], isLoading } = useShopCatalog(filter === 'ALL' ? undefined : filter);
  const { data: inventory = [] } = useInventory();
  const { data: balance } = useGamification();
  const { mutate: purchase, isPending: buying, variables: buyingItemId } = usePurchase();
  const { mutate: dailyLogin } = useDailyLogin();

  const ownedIds = new Set(inventory.map((i) => i.itemId));

  useEffect(() => {
    if (isAuthenticated) dailyLogin();
  }, [isAuthenticated]);

  const handleBuy = (item: ShopItem) => {
    purchase(item.id, {
      onSuccess: () => {
        setBuySuccess(item.id);
        setTimeout(() => setBuySuccess(null), 2000);
        if (item.type === 'TAG' && item.tag) {
          setToast({ name: `Тег получен: ${item.tag.name}`, icon: '🏷', description: item.description, xpReward: 0 });
        }
      },
    });
  };

  return (
    <div className="min-h-screen dark:bg-cyber-bg-outer bg-[#3a5580]">
      {toast && (
        <AchievementToast
          achievement={{ id: '', name: toast.name, description: toast.description, icon: toast.icon, xpReward: toast.xpReward }}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-3 dark:bg-cyber-panel bg-[#2d4a6a] border-b dark:border-cyber-border border-[#1e3a5f]">
        <ChumLogo />
        <div className="flex items-center gap-4">
          {isAuthenticated && balance && (
            <div className="flex items-center gap-1.5 font-mono text-sm text-cyber-orange">
              <span>💰</span>
              <span className="font-bold">{balance.coins}</span>
              <span className="text-xs text-cyber-text-muted">монет</span>
            </div>
          )}
          <Link to="/contests" className="font-mono text-xs dark:text-cyber-text-dim text-[#a0c4e0] hover:text-cyber-cyan transition-colors">КОНКУРСЫ</Link>
          <Link to="/chat" className="font-mono text-xs dark:text-cyber-text-dim text-[#a0c4e0] hover:text-cyber-cyan transition-colors">ЧАТ</Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-mono text-2xl dark:text-cyber-text text-[#e0edf8] mb-1">МАГАЗИН ЧАМА</h1>
          <p className="font-sans text-sm dark:text-cyber-text-dim text-[#a0c4e0]">
            Скины, рамки, теги и значки. За активность начисляются монеты.
          </p>
        </div>

        {/* How to earn coins */}
        {!isAuthenticated && (
          <div className="dark:bg-cyber-panel bg-[#2d4a6a] border dark:border-cyber-border border-[#1e3a5f] rounded-sm p-4 mb-6">
            <p className="font-mono text-xs text-cyber-cyan mb-2 uppercase tracking-widest">Как получить монеты?</p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono dark:text-cyber-text-dim text-[#a0c4e0]">
              <span>Ежедневный вход → +5 💰</span>
              <span>Получить лайк → +5 XP</span>
              <span>Сообщение → +2 XP</span>
              <span>Ачивки → монеты по условию</span>
            </div>
            <Link to="/register" className="block mt-3 font-mono text-xs text-cyber-cyan hover:underline">
              → Зарегистрироваться и начать копить
            </Link>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`font-mono text-xs px-3 py-1.5 rounded-sm border transition-colors ${
                filter === f
                  ? 'border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan'
                  : 'dark:border-cyber-border border-[#1e3a5f] dark:text-cyber-text-dim text-[#a0c4e0] hover:border-cyber-cyan'
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Catalog grid */}
        {isLoading ? (
          <div className="text-center py-16 font-mono text-cyber-text-muted animate-pulse">ЗАГРУЗКА...</div>
        ) : catalog.length === 0 ? (
          <div className="text-center py-16 font-mono text-cyber-text-muted">Товаров пока нет</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {catalog.map((item) => (
              <ShopItemCard
                key={item.id}
                item={item}
                owned={ownedIds.has(item.id) || buySuccess === item.id}
                onBuy={() => handleBuy(item)}
                buying={buying && buyingItemId === item.id}
                coins={balance?.coins ?? 0}
              />
            ))}
          </div>
        )}

        {/* Inventory section */}
        {isAuthenticated && inventory.length > 0 && (
          <div className="mt-12">
            <h2 className="font-mono text-sm dark:text-cyber-text text-[#e0edf8] uppercase tracking-widest mb-4">
              МОЙ ИНВЕНТАРЬ ({inventory.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {inventory.map((inv) => (
                <div
                  key={inv.id}
                  className={`dark:bg-cyber-panel bg-[#2d4a6a] border rounded-sm p-3 flex items-center gap-3 ${
                    inv.isEquipped ? 'border-cyber-cyan' : 'dark:border-cyber-border border-[#1e3a5f]'
                  }`}
                >
                  <span className="text-xl">
                    {inv.item.type === 'SKIN' ? '🎨' :
                     inv.item.type === 'DECORATION' ? '🖼' :
                     inv.item.type === 'TAG' ? '🏷' : '🏅'}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-xs dark:text-cyber-text text-[#e0edf8] truncate">{inv.item.name}</p>
                    {inv.isEquipped && <p className="font-mono text-xs text-cyber-cyan">надет</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
