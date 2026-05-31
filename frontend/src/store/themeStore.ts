import { create } from 'zustand';
import type { Theme } from '../types';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
  localStorage.setItem('chum_theme', theme);
}

const savedTheme = (localStorage.getItem('chum_theme') as Theme) || 'dark';
applyTheme(savedTheme);

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: savedTheme,

  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },

  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    set({ theme: next });
  },
}));
