import type { ShopItem } from '../../api/shop';

const RARITY_STYLES: Record<string, { border: string; glow: string; label: string; labelColor: string }> = {
  common:    { border: 'border-cyber-border',   glow: '',                         label: 'обычный',    labelColor: 'text-cyber-text-muted' },
  rare:      { border: 'border-cyber-cyan',      glow: 'shadow-[0_0_12px_#00d4ff33]', label: 'редкий',     labelColor: 'text-cyber-cyan' },
  epic:      { border: 'border-[#a29bfe]',       glow: 'shadow-[0_0_12px_#a29bfe44]', label: 'эпический',  labelColor: 'text-[#a29bfe]' },
  legendary: { border: 'border-cyber-orange',    glow: 'shadow-[0_0_16px_#ff8c4266]', label: 'легендарный',labelColor: 'text-cyber-orange' },
};

const TYPE_ICONS: Record<string, string> = {
  SKIN: '🎨',
  DECORATION: '🖼',
  TAG: '🏷',
  BADGE: '🏅',
};

interface ShopItemCardProps {
  item: ShopItem;
  owned?: boolean;
  onBuy: () => void;
  buying?: boolean;
  coins: number;
}

export function ShopItemCard({ item, owned, onBuy, buying, coins }: ShopItemCardProps) {
  const r = RARITY_STYLES[item.rarity] ?? RARITY_STYLES.common;
  const canAfford = coins >= item.price;

  return (
    <div
      className={`dark:bg-cyber-panel bg-light-panel border rounded-sm p-4 flex flex-col gap-3 relative
        transition-all duration-200 hover:translate-y-[-2px] ${r.border} ${r.glow}`}
    >
      {/* Rarity badge */}
      <div className="flex items-center justify-between">
        <span className={`font-mono text-xs uppercase tracking-widest ${r.labelColor}`}>{r.label}</span>
        <span className="text-lg">{TYPE_ICONS[item.type]}</span>
      </div>

      {/* Preview */}
      {item.data.bgGradient ? (
        <div
          className={`h-20 rounded-sm bg-gradient-to-br ${item.data.bgGradient} flex items-center justify-center border ${r.border}`}
          style={{ boxShadow: `0 0 20px ${item.data.glowColor ?? '#00d4ff'}22` }}
        >
          <span className="font-mono text-2xl" style={{ color: item.data.primaryColor ?? '#00d4ff', textShadow: `0 0 10px ${item.data.primaryColor ?? '#00d4ff'}` }}>
            A_
          </span>
        </div>
      ) : item.data.emoji ? (
        <div className="h-20 flex items-center justify-center">
          <span className="text-5xl">{item.data.emoji}</span>
        </div>
      ) : item.data.frameStyle ? (
        <div className="h-20 flex items-center justify-center">
          <div
            className="w-16 h-16 rounded-full border-4"
            style={{ borderColor: item.data.borderColor, boxShadow: `0 0 12px ${item.data.borderColor}88` }}
          />
        </div>
      ) : (
        <div className="h-20 dark:bg-cyber-panel-2 bg-light-panel-2 rounded-sm flex items-center justify-center">
          <span className="text-cyber-text-muted font-mono text-xs">PREVIEW</span>
        </div>
      )}

      {/* Info */}
      <div>
        <p className="font-mono text-sm dark:text-cyber-text text-light-text font-bold">{item.name}</p>
        <p className="font-sans text-xs dark:text-cyber-text-dim text-light-text-dim mt-0.5">{item.description}</p>
        {item.tag && (
          <p className="font-mono text-xs text-cyber-cyan mt-1">тег: {item.tag.name}</p>
        )}
      </div>

      {/* Buy */}
      <div className="flex items-center justify-between mt-auto">
        <span className="font-mono text-sm text-cyber-orange font-bold">
          💰 {item.price}
        </span>
        {owned ? (
          <span className="font-mono text-xs text-cyber-green px-2 py-1 border border-cyber-green rounded-sm">
            ✓ куплено
          </span>
        ) : (
          <button
            onClick={onBuy}
            disabled={buying || !canAfford}
            className={`font-mono text-xs px-3 py-1.5 rounded-sm border transition-all
              ${canAfford
                ? 'border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/10 active:scale-95'
                : 'border-cyber-border text-cyber-text-muted cursor-not-allowed opacity-50'
              } disabled:opacity-50`}
          >
            {buying ? '...' : canAfford ? 'КУПИТЬ' : 'ДОРОГО'}
          </button>
        )}
      </div>
    </div>
  );
}
