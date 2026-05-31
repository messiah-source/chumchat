import { api } from './client';
import type { PublicProfile, User } from '../types';

export const usersApi = {
  getMe: () => api.get<User>('/users/me').then((r) => r.data),

  getProfile: (username: string) =>
    api.get<PublicProfile>(`/users/${username}`).then((r) => r.data),

  getTop: () =>
    api.get<PublicProfile[]>('/users/top').then((r) => r.data),

  updateProfile: (data: { bio?: string; theme?: string }) =>
    api.patch('/users/me/profile', data).then((r) => r.data),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ avatarUrl: string }>('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  uploadBanner: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ bannerUrl: string }>('/users/me/banner', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  toggleLike: (userId: string) =>
    api.post<{ liked: boolean }>(`/users/${userId}/like`).then((r) => r.data),

  rateProfile: (userId: string, score: number, comment?: string) =>
    api.post(`/users/${userId}/rate`, { score, comment }).then((r) => r.data),
};
