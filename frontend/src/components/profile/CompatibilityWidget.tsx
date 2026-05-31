import { useMyCompatibility } from '../../hooks/useTags';
import type { TagType } from '../../types';

const TYPE_COLORS: Record<string, string> = {
  FREE: 'text-cyber-text-dim',
  ACHIEVEMENT: 'text-cyber-cyan',
  UNIQUE: 'text-cyber-orange',
  COMPETITIVE: 'text-cyber-red',
};

const TYPE_ICONS: Record<string, string> = {
  FREE: '◈',
  ACHIEVEMENT: '🏆',
  UNIQUE: '💎',
  COMPETITIVE: '⚔️',
};

interface CompatibilityWidgetProps {
  targetUserId: string;
  targetUsername: string;
}

function ScoreArc({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  const color =
    score >= 70 ? '#00d4ff' :
    score >= 40 ? '#ff8c42' :
    '#FF384F';

  return (
    <div className="relative flex items-center justify-center w-16 h-16">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#1e3a5f" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter: `drop-shadow(0 0 4px ${color}80)`, transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <span className="absolute font-mono text-sm font-bold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export function CompatibilityWidget({ targetUserId, targetUsername }: CompatibilityWidgetProps) {
  const { data, isLoading } = useMyCompatibility(targetUserId);

  if (isLoading) {
    return (
      <div className="dark:bg-cyber-panel bg-light-panel border dark:border-cyber-border border-light-border rounded-sm p-4">
        <p className="font-mono text-xs dark:text-cyber-text-muted text-light-text-dim animate-pulse">
          АНАЛИЗ СОВМЕСТИМОСТИ...
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="dark:bg-cyber-panel bg-light-panel border dark:border-cyber-border border-light-border rounded-sm p-4">
      <p className="font-mono text-xs dark:text-cyber-text-muted text-light-text-dim uppercase tracking-widest mb-3">
        Совместимость с {targetUsername}
      </p>

      <div className="flex items-center gap-4 mb-4">
        <ScoreArc score={data.score} />
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs dark:text-cyber-text-dim text-light-text-dim">
            {data.matched} / {Math.max(data.total1, data.total2)} тегов
          </span>
          <span className="font-mono text-xs dark:text-cyber-text-muted text-light-text-dim">
            {data.score >= 70 ? 'Высокая совместимость' :
             data.score >= 40 ? 'Средняя совместимость' :
             data.score > 0 ? 'Низкая совместимость' :
             'Нет общих тегов'}
          </span>
        </div>
      </div>

      {data.matchedTags.length > 0 && (
        <>
          <p className="font-mono text-xs dark:text-cyber-text-muted text-light-text-dim mb-2">
            Общие теги:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.matchedTags.map((t) => (
              <span
                key={t.name}
                className={`font-mono text-xs px-1.5 py-0.5 dark:bg-cyber-panel-2 bg-light-panel-2 border dark:border-cyber-border border-light-border rounded-sm ${TYPE_COLORS[t.type]}`}
                title={`вес: ${t.weight}`}
              >
                {TYPE_ICONS[t.type as TagType]} {t.name}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
