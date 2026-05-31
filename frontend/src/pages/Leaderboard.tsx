import { Link } from 'react-router-dom';
import { useTopProfiles } from '../hooks/useProfile';
import { ChumLogo } from '../components/layout/ChumLogo';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { StatusDot } from '../components/ui/StatusDot';
import type { UserStatus } from '../types';

export default function Leaderboard() {
  const { data: profiles, isLoading } = useTopProfiles();

  return (
    <div className="min-h-screen dark:bg-cyber-bg-outer bg-[#3a5580]">
      <nav className="flex items-center justify-between px-6 py-3 dark:bg-cyber-panel bg-[#2d4a6a] border-b dark:border-cyber-border border-[#1e3a5f]">
        <ChumLogo />
        <div className="flex items-center gap-4">
          <Link to="/search" className="font-mono text-xs dark:text-cyber-text-dim text-[#a0c4e0] hover:text-cyber-cyan transition-colors">ПОИСК</Link>
          <Link to="/chat" className="font-mono text-xs dark:text-cyber-text-dim text-[#a0c4e0] hover:text-cyber-cyan transition-colors">ЧАТ</Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-mono text-2xl dark:text-cyber-text text-[#e0edf8] mb-1">РЕЙТИНГ ЧАМЕРОВ</h1>
        <p className="font-sans text-sm dark:text-cyber-text-dim text-[#a0c4e0] mb-6">Топ по уровню и активности</p>

        {isLoading ? (
          <div className="font-mono text-cyber-text-muted animate-pulse text-center py-12">ЗАГРУЗКА...</div>
        ) : (
          <div className="flex flex-col gap-2">
            {profiles?.map((user, idx) => (
              <Link
                key={user.id}
                to={`/profile/${user.username}`}
                className="flex items-center gap-4 dark:bg-cyber-panel bg-[#2d4a6a] border dark:border-cyber-border border-[#1e3a5f] rounded-sm p-3 hover:border-cyber-cyan transition-colors group"
              >
                {/* Rank */}
                <div className={`w-8 text-center font-mono text-sm font-bold flex-shrink-0 ${
                  idx === 0 ? 'text-yellow-400' :
                  idx === 1 ? 'text-gray-300' :
                  idx === 2 ? 'text-amber-600' :
                  'text-cyber-text-muted'
                }`}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full dark:bg-cyber-panel-3 bg-[#4a6a8a] border dark:border-cyber-border border-[#5a7a9a] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-mono text-base dark:text-cyber-text-dim text-[#c0d4e8]">
                      {user.username[0].toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Name + status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm dark:text-cyber-text text-[#e0edf8] group-hover:text-cyber-cyan transition-colors truncate">
                      {user.username}
                    </span>
                    <StatusDot status={user.status as UserStatus} size="sm" />
                  </div>
                  <div className="font-mono text-xs text-cyber-text-muted">XP: {user.xp}</div>
                </div>

                {/* Level badge */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-mono text-xs px-2 py-0.5 bg-cyber-red text-white rounded-sm">
                    LVL {user.level}
                  </span>
                  <span className="font-mono text-xs text-cyber-red">♥ {user._count.receivedLikes}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
