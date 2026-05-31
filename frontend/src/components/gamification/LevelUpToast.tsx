import { useEffect, useState } from 'react';

interface LevelUpToastProps {
  level: number;
  coinsEarned?: number;
  onDismiss: () => void;
}

export function LevelUpToast({ level, coinsEarned, onDismiss }: LevelUpToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 50);
    const t2 = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300); }, 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-4 px-6 py-5
        dark:bg-cyber-panel bg-light-panel border-2 border-cyber-red rounded-sm shadow-cyber-red
        transition-all duration-300 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
    >
      <div className="text-4xl animate-pulse-slow">⬆</div>
      <div>
        <p className="font-mono text-xs text-cyber-red uppercase tracking-widest">Новый уровень!</p>
        <p className="font-mono text-3xl dark:text-cyber-text text-light-text font-bold">{level}</p>
        {coinsEarned && (
          <p className="font-mono text-xs text-cyber-orange">+{coinsEarned} монет</p>
        )}
      </div>
      <button onClick={onDismiss} className="ml-2 text-cyber-text-muted hover:text-cyber-red self-start">✕</button>
    </div>
  );
}
