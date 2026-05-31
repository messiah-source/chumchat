import { api } from './client';

export interface ContestEntry {
  id: string;
  userId: string;
  createdAt: string;
  user: { id: string; username: string; avatarUrl: string | null; level: number };
  _count: { votes: number };
}

export interface Contest {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  status: 'PENDING' | 'ACTIVE' | 'FINISHED';
  maxWinners: number;
  prizeXp: number;
  prizeCoins: number;
  prizeTag: { id: string; name: string } | null;
  _count: { entries: number };
  entries?: ContestEntry[];
  myEntryId?: string | null;
  myVotedEntryId?: string | null;
}

export const contestsApi = {
  list: (status?: string) =>
    api.get<Contest[]>('/contests', { params: status ? { status } : {} }).then((r) => r.data),

  get: (id: string) =>
    api.get<Contest>(`/contests/${id}`).then((r) => r.data),

  create: (data: {
    title: string;
    description?: string;
    startAt: string;
    endAt: string;
    maxWinners?: number;
    prizeXp?: number;
    prizeCoins?: number;
    prizeTagName?: string;
  }) => api.post<Contest>('/contests', data).then((r) => r.data),

  enter: (contestId: string) =>
    api.post(`/contests/${contestId}/enter`).then((r) => r.data),

  vote: (entryId: string) =>
    api.post(`/contests/entries/${entryId}/vote`).then((r) => r.data),
};
