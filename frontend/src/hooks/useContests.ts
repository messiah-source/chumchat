import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contestsApi } from '../api/contests';

export function useContests(status?: string) {
  return useQuery({
    queryKey: ['contests', status],
    queryFn: () => contestsApi.list(status),
    staleTime: 30_000,
  });
}

export function useContest(id: string) {
  return useQuery({
    queryKey: ['contest', id],
    queryFn: () => contestsApi.get(id),
    enabled: !!id,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useEnterContest(contestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => contestsApi.enter(contestId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contest', contestId] }),
  });
}

export function useVote(contestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => contestsApi.vote(entryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contest', contestId] }),
  });
}

export function useGamification() {
  return useQuery({
    queryKey: ['balance'],
    queryFn: async () => {
      const { gamificationApi } = await import('../api/gamification');
      return gamificationApi.getBalance();
    },
    staleTime: 30_000,
    retry: false,
  });
}

export function useDailyLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { gamificationApi } = await import('../api/gamification');
      return gamificationApi.dailyLogin();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
