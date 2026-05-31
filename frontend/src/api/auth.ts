import { api } from './client';
import type { AuthResponse } from '../types';

export const authApi = {
  register: (email: string, username: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { email, username, password }).then((r) => r.data),

  login: (login: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { login, password }).then((r) => r.data),

  logout: () => api.post('/auth/logout').then((r) => r.data),

  refresh: () =>
    api.post<{ accessToken: string }>('/auth/refresh').then((r) => r.data),
};
