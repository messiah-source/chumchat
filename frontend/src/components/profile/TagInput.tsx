import { useState, useRef, useEffect } from 'react';
import { useTagSearch } from '../../hooks/useTags';
import type { TagWithCount } from '../../api/tags';

const TYPE_LABELS: Record<string, string> = {
  FREE: '',
  ACHIEVEMENT: '🏆',
  UNIQUE: '💎',
  COMPETITIVE: '⚔️',
};

const TYPE_COLORS: Record<string, string> = {
  FREE: 'text-cyber-text-dim',
  ACHIEVEMENT: 'text-cyber-cyan',
  UNIQUE: 'text-cyber-orange',
  COMPETITIVE: 'text-cyber-red',
};

interface TagInputProps {
  onAdd: (name: string) => void;
  loading?: boolean;
  error?: string | null;
}

export function TagInput({ onAdd, loading, error }: TagInputProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: suggestions = [] } = useTagSearch(query);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const submit = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); submit(query); }
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder="Добавить тег..."
          maxLength={30}
          className="flex-1 font-mono text-xs bg-cyber-panel-2 border border-cyber-border rounded-sm px-2.5 py-1.5
            text-cyber-text placeholder-cyber-text-muted focus:outline-none focus:border-cyber-cyan transition-colors"
        />
        <button
          onClick={() => submit(query)}
          disabled={loading || !query.trim()}
          className="font-mono text-xs px-3 py-1.5 bg-cyber-panel-2 border border-cyber-border rounded-sm
            text-cyber-cyan hover:border-cyber-cyan transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? '...' : '+'}
        </button>
      </div>

      {error && <p className="font-mono text-xs text-cyber-red mt-1">{error}</p>}

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-cyber-panel border border-cyber-border rounded-sm shadow-cyber max-h-52 overflow-y-auto">
          {suggestions.map((tag: TagWithCount) => (
            <button
              key={tag.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => submit(tag.name)}
              className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-cyber-panel-2 transition-colors group"
            >
              <span className="flex items-center gap-1.5 font-mono text-xs text-cyber-text">
                <span className={TYPE_COLORS[tag.type]}>{TYPE_LABELS[tag.type]}</span>
                {tag.name}
              </span>
              <span className="font-mono text-xs text-cyber-text-muted group-hover:text-cyber-text-dim">
                {tag._count.users} чел.
              </span>
            </button>
          ))}

          {/* Create new option if no exact match */}
          {query.trim() && !suggestions.find((t) => t.name === query.trim().toLowerCase()) && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => submit(query)}
              className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-cyber-panel-2 transition-colors border-t border-cyber-border"
            >
              <span className="font-mono text-xs text-cyber-cyan">+ Создать тег</span>
              <span className="font-mono text-xs text-cyber-text-dim">«{query.trim()}»</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
