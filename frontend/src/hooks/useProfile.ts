import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users';

export function useProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => usersApi.getProfile(username),
    enabled: !!username,
    staleTime: 30_000,
  });
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: usersApi.getMe,
    staleTime: 60_000,
    retry: false,
  });
}

export function useTopProfiles() {
  return useQuery({
    queryKey: ['top-profiles'],
    queryFn: usersApi.getTop,
    staleTime: 60_000,
  });
}

export function useToggleLike(profileId: string, username: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => usersApi.toggleLike(profileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', username] }),
  });
}

export function useRateProfile(profileId: string, username: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ score, comment }: { score: number; comment?: string }) =>
      usersApi.rateProfile(profileId, score, comment),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', username] }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.uploadAvatar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

export function useUploadBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.uploadBanner,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}
