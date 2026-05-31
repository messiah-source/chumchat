import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useContests, useContest, useEnterContest, useVote } from '../hooks/useContests';
import { useAuthStore } from '../store/authStore';
import { ChumLogo } from '../components/layout/ChumLogo';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Button } from '../components/ui/Button';
import { ContestCard } from '../components/contests/ContestCard';
import type { ContestEntry } from '../api/contests';

type StatusFilter = 'ACTIVE' | 'PENDING' | 'FINISHED' | undefined;

// ── Contest list page ──────────────────────────────────────────────────────

export default function ContestsList() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');
  const { data: contests = [], isLoading } = useContests(statusFilter);
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen dark:bg-cyber-bg-outer bg-[#3a5580]">
      <nav className="flex items-center justify-between px-6 py-3 dark:bg-cyber-panel bg-[#2d4a6a] border-b dark:border-cyber-border border-[#1e3a5f]">
        <ChumLogo />
        <div className="flex items-center gap-4">
          <Link to="/shop" className="font-mono text-xs dark:text-cyber-text-dim text-[#a0c4e0] hover:text-cyber-cyan transition-colors">МАГАЗИН</Link>
          <Link to="/chat" className="font-mono text-xs dark:text-cyber-text-dim text-[#a0c4e0] hover:text-cyber-cyan transition-colors">ЧАТ</Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-mono text-2xl dark:text-cyber-text text-[#e0edf8] mb-1">КОНКУРСЫ</h1>
          <p className="font-sans text-sm dark:text-cyber-text-dim text-[#a0c4e0]">
            Соревнуйся за уникальные теги, XP и монеты. Голосуй за лучшие профили.
          </p>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 mb-6">
          {([['ACTIVE', 'Активные'], ['PENDING', 'Скоро'], ['FINISHED', 'Завершённые'], [undefined, 'Все']] as const).map(([s, label]) => (
            <button
              key={String(s)}
              onClick={() => setStatusFilter(s as StatusFilter)}
              className={`font-mono text-xs px-3 py-1.5 rounded-sm border transition-colors ${
                statusFilter === s
                  ? 'border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan'
                  : 'dark:border-cyber-border border-[#1e3a5f] dark:text-cyber-text-dim text-[#a0c4e0] hover:border-cyber-cyan'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-16 font-mono text-cyber-text-muted animate-pulse">ЗАГРУЗКА...</div>
        ) : contests.length === 0 ? (
          <div className="text-center py-16 dark:bg-cyber-panel bg-[#2d4a6a] border dark:border-cyber-border border-[#1e3a5f] rounded-sm">
            <p className="font-mono text-cyber-text-muted">Конкурсов пока нет</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {contests.map((c) => <ContestCard key={c.id} contest={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Single contest page ────────────────────────────────────────────────────

export function ContestDetail() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuthStore();
  const { data: contest, isLoading } = useContest(id ?? '');
  const { mutate: enter, isPending: entering } = useEnterContest(id ?? '');
  const { mutate: vote, isPending: voting } = useVote(id ?? '');

  if (isLoading) return <ContestShell><div className="font-mono text-cyber-text-muted animate-pulse text-center py-16">ЗАГРУЗКА...</div></ContestShell>;
  if (!contest) return <ContestShell><div className="text-center py-16 font-mono text-cyber-red">Конкурс не найден</div></ContestShell>;

  const myEntry = contest.myEntryId;
  const myVote  = contest.myVotedEntryId;
  const isActive = contest.status === 'ACTIVE';

  const sortedEntries = [...(contest.entries ?? [])].sort((a, b) => b._count.votes - a._count.votes);
  const maxVotes = sortedEntries[0]?._count.votes ?? 0;

  return (
    <ContestShell>
      {/* Header */}
      <div className="dark:bg-cyber-panel bg-[#2d4a6a] border dark:border-cyber-border border-[#1e3a5f] rounded-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="font-mono text-xl dark:text-cyber-text text-[#e0edf8]">{contest.title}</h1>
          <div className={`font-mono text-xs px-2 py-1 rounded-sm border ${
            isActive ? 'border-cyber-green text-cyber-green' :
            contest.status === 'PENDING' ? 'border-cyber-text-muted text-cyber-text-muted' :
            'border-cyber-text-muted text-cyber-text-muted'
          }`}>
            {isActive ? '● ИДЁТ' : contest.status === 'PENDING' ? '○ СКОРО' : '✓ ЗАВЕРШЁН'}
          </div>
        </div>

        {contest.description && (
          <p className="font-sans text-sm dark:text-cyber-text-dim text-[#a0c4e0] mb-4">{contest.description}</p>
        )}

        {/* Prizes */}
        <div className="flex flex-wrap gap-3 mb-4">
          {contest.prizeXp > 0 && <span className="font-mono text-xs text-cyber-cyan border border-cyber-cyan/30 px-2 py-1 rounded-sm">+{contest.prizeXp} XP</span>}
          {contest.prizeCoins > 0 && <span className="font-mono text-xs text-cyber-orange border border-cyber-orange/30 px-2 py-1 rounded-sm">+{contest.prizeCoins} 💰</span>}
          {contest.prizeTag && <span className="font-mono text-xs text-cyber-red border border-cyber-red/30 px-2 py-1 rounded-sm">тег: {contest.prizeTag.name}</span>}
          <span className="font-mono text-xs text-cyber-text-muted">топ-{contest.maxWinners} победителей</span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-4 font-mono text-xs text-cyber-text-muted">
          <span>Начало: {new Date(contest.startAt).toLocaleString('ru')}</span>
          <span>Конец: {new Date(contest.endAt).toLocaleString('ru')}</span>
          <span>{contest._count.entries} участников</span>
        </div>

        {/* Participate */}
        {me && isActive && !myEntry && (
          <Button className="mt-4" onClick={() => enter()} loading={entering}>
            УЧАСТВОВАТЬ
          </Button>
        )}
        {myEntry && (
          <p className="mt-4 font-mono text-xs text-cyber-green">✓ Ты участвуешь</p>
        )}
      </div>

      {/* Entries */}
      <h2 className="font-mono text-sm dark:text-cyber-text text-[#e0edf8] uppercase tracking-widest mb-4">
        Участники ({sortedEntries.length})
      </h2>

      {sortedEntries.length === 0 ? (
        <p className="font-mono text-xs text-cyber-text-muted text-center py-8">Пока нет участников</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedEntries.map((entry: ContestEntry, idx: number) => {
            const isWinner = contest.status === 'FINISHED' && idx < contest.maxWinners;
            const isVotedByMe = myVote === entry.id;
            const votePercent = maxVotes ? (entry._count.votes / maxVotes) * 100 : 0;

            return (
              <div
                key={entry.id}
                className={`dark:bg-cyber-panel bg-[#2d4a6a] border rounded-sm p-4 ${
                  isWinner ? 'border-cyber-orange' : 'dark:border-cyber-border border-[#1e3a5f]'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {/* Rank */}
                  <span className={`font-mono text-sm font-bold w-8 text-center flex-shrink-0 ${
                    idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-600' : 'text-cyber-text-muted'
                  }`}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </span>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full dark:bg-cyber-panel-3 bg-[#4a6a8a] border dark:border-cyber-border border-[#5a7a9a] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {entry.user.avatarUrl ? (
                      <img src={entry.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-mono dark:text-cyber-text-dim text-[#c0d4e8]">
                        {entry.user.username[0].toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <Link to={`/profile/${entry.user.username}`} className="font-mono text-sm dark:text-cyber-text text-[#e0edf8] hover:text-cyber-cyan transition-colors">
                      {entry.user.username}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs px-1 py-0.5 bg-cyber-red text-white rounded-sm">
                        {entry.user.level}
                      </span>
                      {isWinner && <span className="font-mono text-xs text-cyber-orange">🏆 победитель</span>}
                    </div>
                  </div>

                  {/* Vote count + button */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-sm dark:text-cyber-text text-[#e0edf8] font-bold">
                      {entry._count.votes}
                    </span>
                    {me && isActive && entry.userId !== me.id && (
                      <button
                        onClick={() => vote(entry.id)}
                        disabled={voting}
                        className={`font-mono text-xs px-3 py-1.5 rounded-sm border transition-all active:scale-95 ${
                          isVotedByMe
                            ? 'border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan'
                            : 'dark:border-cyber-border border-[#1e3a5f] dark:text-cyber-text-dim text-[#a0c4e0] hover:border-cyber-cyan hover:text-cyber-cyan'
                        }`}
                      >
                        {isVotedByMe ? '✓ голос' : '▲ голос'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Vote bar */}
                {maxVotes > 0 && (
                  <div className="h-1 dark:bg-cyber-panel-3 bg-[#4a6a8a] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isWinner ? 'bg-cyber-orange' : 'bg-cyber-cyan'
                      }`}
                      style={{ width: `${votePercent}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </ContestShell>
  );
}

function ContestShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen dark:bg-cyber-bg-outer bg-[#3a5580]">
      <nav className="flex items-center justify-between px-6 py-3 dark:bg-cyber-panel bg-[#2d4a6a] border-b dark:border-cyber-border border-[#1e3a5f]">
        <ChumLogo />
        <div className="flex items-center gap-4">
          <Link to="/contests" className="font-mono text-xs text-cyber-cyan hover:underline">← КОНКУРСЫ</Link>
          <ThemeToggle />
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
