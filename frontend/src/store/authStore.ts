import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  accessToken: string | null;
  user: Pick<User, 'id' | 'username' | 'email' | 'level' | 'xp' | 'avatarUrl' | 'status'> | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthState['user']) => void;
  setUser: (user: AuthState['user']) => void;
  clearAuth: () => void;
  updateToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,

  setAuth: (accessToken, user) => set({ accessToken, user, isAuthenticated: true }),
  setUser: (user) => set({ user }),
  clearAuth: () => set({ accessToken: null, user: null, isAuthenticated: false }),
  updateToken: (accessToken) => set({ accessToken }),
}));
