import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { chatApi } from '../api/chat';
import { useChatStore } from '../store/chatStore';
import { useSocket } from './useSocket';

export function useSquares() {
  return useQuery({
    queryKey: ['squares'],
    queryFn: chatApi.getSquares,
    staleTime: 60_000,
  });
}

export function useMyRooms() {
  const { setRooms } = useChatStore();
  const q = useQuery({
    queryKey: ['my-rooms'],
    queryFn: chatApi.getMyRooms,
    staleTime: 30_000,
  });
  useEffect(() => { if (q.data) setRooms(q.data); }, [q.data]);
  return q;
}

export function useRoomMessages(roomId: string | null) {
  const { setMessages, messages } = useChatStore();

  const q = useQuery({
    queryKey: ['messages', roomId],
    queryFn: () => chatApi.getMessages(roomId!),
    enabled: !!roomId,
    staleTime: 0,
  });

  useEffect(() => {
    if (q.data && roomId) setMessages(roomId, q.data);
  }, [q.data, roomId]);

  return {
    messages: roomId ? (messages[roomId] ?? []) : [],
    isLoading: q.isLoading,
    fetchOlder: async (cursor: string) => {
      if (!roomId) return;
      const older = await chatApi.getMessages(roomId, cursor);
      useChatStore.getState().prependMessages(roomId, older);
    },
  };
}

export function useJoinRoom() {
  const qc = useQueryClient();
  const { joinRoom } = useSocket();
  return useMutation({
    mutationFn: chatApi.joinRoom,
    onSuccess: (_, roomId) => {
      joinRoom(roomId);
      qc.invalidateQueries({ queryKey: ['my-rooms'] });
    },
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  const { joinRoom } = useSocket();
  return useMutation({
    mutationFn: chatApi.createRoom,
    onSuccess: (room) => {
      joinRoom(room.id);
      qc.invalidateQueries({ queryKey: ['my-rooms'] });
    },
  });
}
