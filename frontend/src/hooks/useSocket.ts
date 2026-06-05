import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import type { ChatMessage } from '../api/chat';

let socket: Socket | null = null;
let socketInitialized = false;

export function useSocket() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const {
    addMessage,
    updateMessage,
    deleteMessage,
    updateReactions,
    setTyping,
    setUserStatus,
  } = useChatStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken || socketInitialized) return;
    socketInitialized = true;

    socket = io('/chat', {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    socket.on('new_message', (msg: ChatMessage) => addMessage(msg));
    socket.on('message_edited', (msg: ChatMessage) => updateMessage(msg));
    socket.on('message_deleted', ({ messageId, roomId }: { messageId: string; roomId: string }) =>
      deleteMessage(messageId, roomId),
    );
    socket.on('reaction_updated', ({ messageId, roomId, reactions }: { messageId: string; roomId: string; reactions: Record<string, { count: number; users: string[] }> }) =>
      updateReactions(messageId, roomId, reactions),
    );
    socket.on('typing', ({ username, typing, roomId }: { username: string; typing: boolean; roomId: string }) =>
      setTyping(roomId, username, typing),
    );
    socket.on('user_status', ({ userId, status }: { userId: string; status: string }) =>
      setUserStatus(userId, status),
    );

    return () => {
      if (!isAuthenticated) {
        socket?.disconnect();
        socket = null;
        socketInitialized = false;
      }
    };
  }, [isAuthenticated, accessToken]);

  const joinRoom = useCallback((roomId: string) => {
    socket?.emit('join_room', { roomId });
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    socket?.emit('leave_room', { roomId });
  }, []);

  const sendMessage = useCallback((roomId: string, content: string) => {
    socket?.emit('send_message', { roomId, content });
  }, []);

  const editMessage = useCallback((messageId: string, content: string) => {
    socket?.emit('edit_message', { messageId, content });
  }, []);

  const deleteMsg = useCallback((messageId: string) => {
    socket?.emit('delete_message', { messageId });
  }, []);

  const toggleReaction = useCallback((messageId: string, emoji: string, roomId: string) => {
    socket?.emit('toggle_reaction', { messageId, emoji, roomId });
  }, []);

  const startTyping = useCallback((roomId: string) => {
    socket?.emit('typing_start', { roomId });
  }, []);

  const stopTyping = useCallback((roomId: string) => {
    socket?.emit('typing_stop', { roomId });
  }, []);

  const setStatus = useCallback((status: 'ONLINE' | 'OFFLINE' | 'AFK') => {
    socket?.emit('set_status', { status });
  }, []);

  const startPrivate = useCallback((targetUserId: string, squareId: string): Promise<{ roomId: string }> => {
    return new Promise((resolve) => {
      socket?.emit('start_private', { targetUserId, squareId }, resolve);
    });
  }, []);

  return {
    socket,
    joinRoom,
    leaveRoom,
    sendMessage,
    editMessage,
    deleteMessage: deleteMsg,
    toggleReaction,
    startTyping,
    stopTyping,
    setStatus,
    startPrivate,
  };
}
