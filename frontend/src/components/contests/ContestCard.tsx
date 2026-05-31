import { Link } from 'react-router-dom';
import type { Contest } from '../../api/contests';

const STATUS_STYLES = {
  PENDING:  { dot: 'bg-cyber-text-muted', label: 'Скоро' },
  ACTIVE:   { dot: 'bg-cyber-green shadow-[0_0_6px_#39ff14]', label: 'Идёт' },
  FINISHED: { dot: 'bg-cyber-text-muted', label: 'Завершён' },
};

function Countdown({ endAt }: { endAt: string }) {
  const end = new Date(endAt).getTime();
  const now = Date.now();
  const diff = Math.max(0, end - now);

  const days    = Math.floor(diff / 86400000);
  const hours   = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  if (diff === 0) return <span className="text-cyber-text-muted">Завершён</span>;
  return (
    <span>
      {days > 0 && `${days}д `}{hours}ч {minutes}м
    </span>
  );
}

interface ContestCardProps {
  contest: Contest;
}

export function ContestCard({ contest }: ContestCardProps) {
  const s = STATUS_STYLES[contest.status];

  return (
    <Link
      to={`/contests/${contest.id}`}
      className="block dark:bg-cyber-panel bg-light-panel border dark:border-cyber-border border-light-border rounded-sm p-5
        hover:border-cyber-cyan transition-colors duration-200 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-mono text-sm dark:text-cyber-text text-light-text font-bold group-hover:text-cyber-cyan transition-colors">
          {contest.title}
        </h3>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`w-2 h-2 rounded-full ${s.dot}`} />
          <span className="font-mono text-xs text-cyber-text-muted">{s.label}</span>
        </div>
      </div>

      {contest.description && (
        <p className="font-sans text-xs dark:text-cyber-text-dim text-light-text-dim mb-3 line-clamp-2">
          {contest.description}
        </p>
      )}

      {/* Prizes */}
      <div className="flex items-center gap-3 mb-3">
        {contest.prizeXp > 0 && (
          <span className="font-mono text-xs text-cyber-cyan">+{contest.prizeXp} XP</span>
        )}
        {contest.prizeCoins > 0 && (
          <span className="font-mono text-xs text-cyber-orange">+{contest.prizeCoins} 💰</span>
        )}
        {contest.prizeTag && (
          <span className="font-mono text-xs px-1.5 py-0.5 border border-cyber-red text-cyber-red rounded-sm">
            тег: {contest.prizeTag.name}
          </span>
        )}
        <span className="font-mono text-xs text-cyber-text-muted ml-auto">
          топ-{contest.maxWinners}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between font-mono text-xs text-cyber-text-muted">
        <span>{contest._count.entries} участников</span>
        {contest.status === 'ACTIVE' && (
          <span>
            до конца: <Countdown endAt={contest.endAt} />
          </span>
        )}
        {contest.status === 'FINISHED' && (
          <span>завершён {new Date(contest.endAt).toLocaleDateString('ru')}</span>
        )}
        {contest.status === 'PENDING' && (
          <span>начало: {new Date(contest.startAt).toLocaleDateString('ru')}</span>
        )}
      </div>
    </Link>
  );
}
