import type { UserStatus } from '../../types';

const colors: Record<UserStatus, string> = {
  ONLINE: 'bg-cyber-green shadow-[0_0_6px_#39ff14]',
  OFFLINE: 'bg-cyber-text-muted',
  AFK: 'bg-cyber-orange shadow-[0_0_6px_#ff8c42]',
};

const labels: Record<UserStatus, string> = {
  ONLINE: 'онлайн',
  OFFLINE: 'оффлайн',
  AFK: 'афк',
};

interface StatusDotProps {
  status: UserStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function StatusDot({ status, showLabel = false, size = 'md' }: StatusDotProps) {
  const sz = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  return (
    <span className="flex items-center gap-1.5">
      <span className={`${sz} rounded-full ${colors[status]} inline-block`} />
      {showLabel && (
        <span className="font-mono text-xs text-cyber-text-dim">{labels[status]}</span>
      )}
    </span>
  );
}
