import { create } from 'zustand';
import type { ChatRoom, ChatMessage } from '../api/chat';

interface TypingState {
  [roomId: string]: string[]; // usernames typing
}

interface ChatState {
  activeRoomId: string | null;
  rooms: ChatRoom[];
  messages: Record<string, ChatMessage[]>;
  typing: TypingState;
  onlineUsers: Record<string, string>; // userId -> status

  setActiveRoom: (roomId: string | null) => void;
  setRooms: (rooms: ChatRoom[]) => void;
  setMessages: (roomId: string, messages: ChatMessage[]) => void;
  prependMessages: (roomId: string, messages: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (msg: ChatMessage) => void;
  deleteMessage: (messageId: string, roomId: string) => void;
  updateReactions: (messageId: string, roomId: string, reactions: Record<string, { count: number; users: string[] }>) => void;
  setTyping: (roomId: string, username: string, isTyping: boolean) => void;
  setUserStatus: (userId: string, status: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeRoomId: null,
  rooms: [],
  messages: {},
  typing: {},
  onlineUsers: {},

  setActiveRoom: (roomId) => set({ activeRoomId: roomId }),

  setRooms: (rooms) => set({ rooms }),

  setMessages: (roomId, messages) =>
    set((s) => ({ messages: { ...s.messages, [roomId]: messages } })),

  prependMessages: (roomId, messages) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: [...messages, ...(s.messages[roomId] ?? [])],
      },
    })),

  addMessage: (msg) =>
    set((s) => {
      const existing = s.messages[msg.roomId] ?? [];
      if (existing.some((m) => m.id === msg.id)) return s;
      return {
        messages: {
          ...s.messages,
          [msg.roomId]: [...existing, msg],
        },
      };
    }),

  updateMessage: (msg) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [msg.roomId]: (s.messages[msg.roomId] ?? []).map((m) => (m.id === msg.id ? msg : m)),
      },
    })),

  deleteMessage: (messageId, roomId) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: (s.messages[roomId] ?? []).map((m) =>
          m.id === messageId ? { ...m, deletedAt: new Date().toISOString(), content: '[удалено]' } : m,
        ),
      },
    })),

  updateReactions: (messageId, roomId, reactions) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: (s.messages[roomId] ?? []).map((m) => {
          if (m.id !== messageId) return m;
          const newReactions = Object.entries(reactions).flatMap(([emoji, data]) =>
            data.users.map((username, i) => ({
              id: `${messageId}-${emoji}-${i}`,
              emoji,
              userId: '',
              user: { username },
            })),
          );
          return { ...m, reactions: newReactions };
        }),
      },
    })),

  setTyping: (roomId, username, isTyping) =>
    set((s) => {
      const current = s.typing[roomId] ?? [];
      const updated = isTyping
        ? current.includes(username) ? current : [...current, username]
        : current.filter((u) => u !== username);
      return { typing: { ...s.typing, [roomId]: updated } };
    }),

  setUserStatus: (userId, status) =>
    set((s) => ({ onlineUsers: { ...s.onlineUsers, [userId]: status } })),
}));
