import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useSearchByTags, usePopularTags } from '../hooks/useTags';
import { useMyCompatibility } from '../hooks/useTags';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { StatusDot } from '../components/ui/StatusDot';
import { ChumLogo } from '../components/layout/ChumLogo';
import type { UserSearchResult } from '../api/tags';
import type { UserStatus } from '../types';

const TYPE_COLORS: Record<string, string> = {
  FREE: 'border-cyber-border text-cyber-text-dim',
  ACHIEVEMENT: 'border-cyber-cyan text-cyber-cyan',
  UNIQUE: 'border-cyber-orange text-cyber-orange',
  COMPETITIVE: 'border-cyber-red text-cyber-red',
};

function UserCard({ user }: { user: UserSearchResult }) {
  const { isAuthenticated, user: me } = useAuthStore();
  const { data: compat } = useMyCompatibility(user.id, isAuthenticated && me?.id !== user.id);

  return (
    <Link
      to={`/profile/${user.username}`}
      className="block dark:bg-cyber-panel bg-light-panel border dark:border-cyber-border border-light-border rounded-sm p-4
        hover:border-cyber-cyan transition-colors duration-200 group"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full dark:bg-cyber-panel-3 bg-light-panel-3 border dark:border-cyber-border border-light-border flex items-center justify-center flex-shrink-0 overflow-hidden">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-mono text-lg dark:text-cyber-text-dim text-light-text-dim">
              {user.username[0].toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm dark:text-cyber-text text-light-text group-hover:text-cyber-cyan transition-colors">
              {user.username}
            </span>
            <span className="font-mono text-xs px-1.5 py-0.5 bg-cyber-red text-white rounded-sm">{user.level}</span>
            <StatusDot status={user.status as UserStatus} size="sm" />
          </div>

          {user.bio && (
            <p
              className="font-sans text-xs dark:text-cyber-text-dim text-light-text-dim line-clamp-2 mb-2"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(user.bio) }}
            />
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {user.tags.slice(0, 6).map((ut) => (
              <span
                key={ut.id}
                className={`font-mono text-xs px-1.5 py-0.5 border rounded-sm ${TYPE_COLORS[ut.tag.type]}`}
              >
                {ut.tag.name}
              </span>
            ))}
            {user.tags.length > 6 && (
              <span className="font-mono text-xs text-cyber-text-muted">+{user.tags.length - 6}</span>
            )}
          </div>
        </div>

        {/* Compatibility score */}
        {compat && (
          <div className="flex flex-col items-center flex-shrink-0">
            <span
              className="font-mono text-lg font-bold"
              style={{
                color: compat.score >= 70 ? '#00d4ff' : compat.score >= 40 ? '#ff8c42' : '#FF384F',
              }}
            >
              {compat.score}%
            </span>
            <span className="font-mono text-xs text-cyber-text-muted">совм.</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function Search() {
  const [inputVal, setInputVal] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const { data: popular } = usePopularTags();
  const { data: results, isFetching } = useSearchByTags(activeTags, LIMIT, offset);
  const { theme } = useThemeStore();

  const addTag = useCallback((name: string) => {
    const n = name.trim().toLowerCase();
    if (!n || activeTags.includes(n)) return;
    setActiveTags((prev) => [...prev, n]);
    setInputVal('');
    setOffset(0);
  }, [activeTags]);

  const removeTag = useCallback((name: string) => {
    setActiveTags((prev) => prev.filter((t) => t !== name));
    setOffset(0);
  }, []);

  const total = results?.total ?? 0;
  const users = results?.users ?? [];
  const hasMore = offset + LIMIT < total;

  return (
    <div className="min-h-screen dark:bg-cyber-bg-outer bg-[#3a5580]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-3 dark:bg-cyber-panel bg-[#2d4a6a] border-b dark:border-cyber-border border-[#1e3a5f]">
        <ChumLogo />
        <div className="flex items-center gap-4">
          <Link to="/chat" className="font-mono text-xs dark:text-cyber-text-dim text-[#a0c4e0] hover:text-cyber-cyan transition-colors">ЧАТ</Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="font-mono text-2xl dark:text-cyber-text text-[#e0edf8] mb-1">
            ПОИСК ПО ТЕГАМ
          </h1>
          <p className="font-sans text-sm dark:text-cyber-text-dim text-[#a0c4e0]">
            Добавь теги — найди людей с совпадающими интересами
          </p>
        </div>

        {/* Tag input */}
        <div className="dark:bg-cyber-panel bg-[#2d4a6a] border dark:border-cyber-border border-[#1e3a5f] rounded-sm p-4 mb-4">
          <div className="flex gap-2 mb-3">
            <input
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(inputVal); }
              }}
              placeholder="Введи тег и нажми Enter..."
              className="flex-1 font-mono text-sm bg-cyber-panel-2 border border-cyber-border rounded-sm px-3 py-2
                dark:text-cyber-text placeholder-cyber-text-muted focus:outline-none focus:border-cyber-cyan transition-colors"
            />
            <button
              onClick={() => addTag(inputVal)}
              disabled={!inputVal.trim()}
              className="font-mono text-sm px-4 py-2 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan
                rounded-sm hover:bg-cyber-cyan/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              + ДОБАВИТЬ
            </button>
          </div>

          {/* Active tags */}
          {activeTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {activeTags.map((t) => (
                <span key={t} className="flex items-center gap-1.5 font-mono text-xs px-2 py-1 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan rounded-sm">
                  {t}
                  <button onClick={() => removeTag(t)} className="hover:text-cyber-red ml-0.5">×</button>
                </span>
              ))}
              <button
                onClick={() => { setActiveTags([]); setOffset(0); }}
                className="font-mono text-xs text-cyber-text-muted hover:text-cyber-red transition-colors"
              >
                очистить всё
              </button>
            </div>
          )}

          {/* Popular tags quick-add */}
          {popular && popular.length > 0 && (
            <div>
              <p className="font-mono text-xs text-cyber-text-muted mb-2">Популярные теги:</p>
              <div className="flex flex-wrap gap-1.5">
                {popular.slice(0, 15).map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => addTag(tag.name)}
                    disabled={activeTags.includes(tag.name)}
                    className={`font-mono text-xs px-2 py-1 border rounded-sm transition-colors ${
                      activeTags.includes(tag.name)
                        ? 'border-cyber-cyan/30 text-cyber-cyan/30 cursor-default'
                        : 'border-cyber-border text-cyber-text-dim hover:border-cyber-cyan hover:text-cyber-cyan'
                    }`}
                  >
                    {tag.name}
                    <span className="ml-1 text-cyber-text-muted">{tag._count.users}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {activeTags.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-mono text-cyber-text-muted">Добавь теги чтобы найти людей</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-xs dark:text-cyber-text-muted text-[#a0c4e0]">
                {isFetching ? 'ПОИСК...' : `Найдено: ${total} пользователей`}
              </p>
              {total > 0 && (
                <p className="font-mono text-xs text-cyber-text-muted">
                  {offset + 1}–{Math.min(offset + LIMIT, total)} из {total}
                </p>
              )}
            </div>

            {users.length === 0 && !isFetching ? (
              <div className="dark:bg-cyber-panel bg-[#2d4a6a] border dark:border-cyber-border border-[#1e3a5f] rounded-sm p-8 text-center">
                <p className="font-mono text-cyber-text-muted mb-1">Никого не найдено</p>
                <p className="font-sans text-sm dark:text-cyber-text-dim text-[#a0c4e0]">
                  Попробуй другие теги или создай свой профиль с этими тегами
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {users.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {(offset > 0 || hasMore) && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                  disabled={offset === 0}
                  className="font-mono text-xs px-4 py-2 border dark:border-cyber-border border-[#1e3a5f] rounded-sm
                    dark:text-cyber-text-dim text-[#a0c4e0] hover:border-cyber-cyan hover:text-cyber-cyan
                    transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← НАЗАД
                </button>
                <button
                  onClick={() => setOffset(offset + LIMIT)}
                  disabled={!hasMore}
                  className="font-mono text-xs px-4 py-2 border dark:border-cyber-border border-[#1e3a5f] rounded-sm
                    dark:text-cyber-text-dim text-[#a0c4e0] hover:border-cyber-cyan hover:text-cyber-cyan
                    transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ВПЕРЁД →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
