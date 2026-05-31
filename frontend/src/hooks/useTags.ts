import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from '../api/tags';

export function useTagSearch(q: string) {
  return useQuery({
    queryKey: ['tag-search', q],
    queryFn: () => (q.length >= 1 ? tagsApi.search(q) : tagsApi.popular()),
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  });
}

export function usePopularTags() {
  return useQuery({
    queryKey: ['popular-tags'],
    queryFn: () => tagsApi.popular(30),
    staleTime: 60_000,
  });
}

export function useAddTag(username: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => tagsApi.addTag(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', username] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useRemoveTag(username: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) => tagsApi.removeTag(tagId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', username] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useCompatibility(userId1: string, userId2: string, enabled = true) {
  return useQuery({
    queryKey: ['compatibility', userId1, userId2],
    queryFn: () => tagsApi.getCompatibility(userId1, userId2),
    enabled: enabled && !!userId1 && !!userId2 && userId1 !== userId2,
    staleTime: 30_000,
  });
}

export function useMyCompatibility(targetUserId: string, enabled = true) {
  return useQuery({
    queryKey: ['my-compat', targetUserId],
    queryFn: () => tagsApi.getMyCompatibility(targetUserId),
    enabled: enabled && !!targetUserId,
    staleTime: 30_000,
  });
}

export function useSearchByTags(tags: string[], limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['search-users', tags, limit, offset],
    queryFn: () => tagsApi.searchUsers(tags, limit, offset),
    enabled: tags.length > 0,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
