import type { Achievement } from '../../types';
import DOMPurify from 'dompurify';

interface AchievementBadgeProps {
  achievement: Achievement;
  earnedAt?: string;
}

export function AchievementBadge({ achievement, earnedAt }: AchievementBadgeProps) {
  const safeName = DOMPurify.sanitize(achievement.name);
  const safeDesc = DOMPurify.sanitize(achievement.description);

  return (
    <div
      title={`${safeName}: ${safeDesc}${earnedAt ? ` · ${new Date(earnedAt).toLocaleDateString('ru')}` : ''}`}
      className="flex items-center gap-1.5 px-2 py-1 bg-cyber-panel rounded-sm border border-cyber-border hover:border-cyber-cyan transition-colors cursor-default group"
    >
      <span className="text-base">{achievement.icon}</span>
      <span className="font-mono text-xs text-cyber-text-dim group-hover:text-cyber-text transition-colors">
        {safeName}
      </span>
    </div>
  );
}
