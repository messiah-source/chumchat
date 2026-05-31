import { useThemeStore } from '../../store/themeStore';

export function ThemeToggle() {
  const { theme, toggle } = useThemeStore();

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
      className="relative w-12 h-6 rounded-full border border-cyber-border transition-all duration-300
        dark:bg-cyber-panel-2 bg-light-panel-2 flex items-center px-1 group"
    >
      <span
        className={`w-4 h-4 rounded-full transition-all duration-300 ${
          theme === 'dark'
            ? 'translate-x-0 bg-cyber-cyan shadow-glow-cyan'
            : 'translate-x-6 bg-cyber-red shadow-glow-red'
        }`}
      />
    </button>
  );
}
