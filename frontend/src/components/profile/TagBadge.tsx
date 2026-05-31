import type { Tag, TagType } from '../../types';

const typeColors: Record<TagType, string> = {
  FREE: 'border-cyber-border text-cyber-text-dim',
  ACHIEVEMENT: 'border-cyber-cyan text-cyber-cyan',
  UNIQUE: 'border-cyber-orange text-cyber-orange',
  COMPETITIVE: 'border-cyber-red text-cyber-red',
};

interface TagBadgeProps {
  tag: Tag;
  onRemove?: () => void;
}

export function TagBadge({ tag, onRemove }: TagBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border font-mono text-xs ${typeColors[tag.type]}`}
    >
      {tag.name}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-cyber-red transition-colors ml-0.5">×</button>
      )}
    </span>
  );
}
