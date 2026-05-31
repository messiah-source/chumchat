interface XpRingProps {
  level: number;
  xp: number;
  size?: number;
}

function xpForLevel(lvl: number) {
  return lvl * lvl * 100;
}

export function XpRing({ level, xp, size = 160 }: XpRingProps) {
  const needed = xpForLevel(level);
  const prev = xpForLevel(level - 1);
  const progress = Math.min((xp - prev) / (needed - prev), 1);

  const r = (size / 2) - 10;
  const circumference = 2 * Math.PI * r;
  const strokeDash = circumference * progress;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="absolute inset-0 -rotate-90"
        style={{ filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.5))' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="6"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#xpGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
        />
        <defs>
          <linearGradient id="xpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#4fc3f7" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[calc(100%-28px)] h-[calc(100%-28px)] rounded-full overflow-hidden bg-cyber-panel-2 border-2 border-cyber-panel">
        </div>
      </div>
    </div>
  );
}
