import { useEffect, useState } from 'react';
import type { Achievement } from '../../types';

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
}

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 50);
    const t2 = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300); }, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4
        dark:bg-cyber-panel bg-light-panel border border-cyber-cyan rounded-sm shadow-glow-cyan
        transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <span className="text-3xl">{achievement.icon}</span>
      <div>
        <p className="font-mono text-xs text-cyber-cyan uppercase tracking-widest">Ачивка разблокирована!</p>
        <p className="font-mono text-sm dark:text-cyber-text text-light-text font-bold">{achievement.name}</p>
        <p className="font-sans text-xs dark:text-cyber-text-dim text-light-text-dim">{achievement.description}</p>
        {achievement.xpReward > 0 && (
          <p className="font-mono text-xs text-cyber-orange mt-0.5">+{achievement.xpReward} XP</p>
        )}
      </div>
      <button onClick={onDismiss} className="ml-2 text-cyber-text-muted hover:text-cyber-red">✕</button>
    </div>
  );
}
