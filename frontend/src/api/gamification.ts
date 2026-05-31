import { api } from './client';

export const gamificationApi = {
  getBalance: () =>
    api.get<{ coins: number }>('/gamification/balance').then((r) => r.data),

  getXpHistory: () =>
    api.get<{ id: string; amount: number; reason: string; createdAt: string }[]>('/gamification/xp-history').then((r) => r.data),

  dailyLogin: () =>
    api.post<{ bonus: boolean; xp?: number; coins?: number }>('/gamification/daily-login').then((r) => r.data),

  getLeaderboard: () =>
    api.get('/gamification/leaderboard').then((r) => r.data),
};
