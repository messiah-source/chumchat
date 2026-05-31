import { api } from './client';
import type { Tag } from '../types';

export interface TagWithCount extends Tag {
  _count: { users: number };
}

export interface CompatibilityResult {
  score: number;
  matchedTags: { name: string; type: string; weight: number }[];
  total1: number;
  total2: number;
  matched: number;
}

export interface UserSearchResult {
  id: string;
  username: string;
  avatarUrl: string | null;
  level: number;
  xp: number;
  status: string;
  bio: string | null;
  tags: { id: string; tag: Tag }[];
  _count: { receivedLikes: number };
}

export const tagsApi = {
  search: (q: string, limit = 20) =>
    api.get<TagWithCount[]>('/tags/search', { params: { q, limit } }).then((r) => r.data),

  popular: (limit = 30) =>
    api.get<TagWithCount[]>('/tags/popular', { params: { limit } }).then((r) => r.data),

  searchUsers: (tags: string[], limit = 20, offset = 0) =>
    api
      .get<{ users: UserSearchResult[]; total: number }>('/tags/users', {
        params: { tags, limit, offset },
        paramsSerializer: (params) => {
          const parts: string[] = [];
          for (const [k, v] of Object.entries(params)) {
            if (Array.isArray(v)) v.forEach((i) => parts.push(`${k}=${encodeURIComponent(i)}`));
            else parts.push(`${k}=${encodeURIComponent(String(v))}`);
          }
          return parts.join('&');
        },
      })
      .then((r) => r.data),

  getCompatibility: (userId1: string, userId2: string) =>
    api.get<CompatibilityResult>(`/tags/compatibility/${userId1}/${userId2}`).then((r) => r.data),

  getMyCompatibility: (targetUserId: string) =>
    api.get<CompatibilityResult>(`/tags/compatibility/me/${targetUserId}`).then((r) => r.data),

  addTag: (name: string) =>
    api.post<Tag>('/tags/me', { name }).then((r) => r.data),

  removeTag: (tagId: string) =>
    api.delete(`/tags/me/${tagId}`).then((r) => r.data),
};
