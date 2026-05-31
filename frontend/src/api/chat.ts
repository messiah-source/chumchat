import { api } from './client';

export interface ChatRoom {
  id: string;
  name: string;
  description: string | null;
  type: 'SQUARE' | 'GROUP' | 'DM';
  isEphemeral: boolean;
  creatorId: string | null;
  createdAt: string;
  tags: { id: string; tag: { id: string; name: string; type: string } }[];
  _count: { members: number; messages: number };
  role?: string;
  lastRead?: string;
  messages?: { content: string; createdAt: string; user: { username: string } }[];
}

export interface ChatMessage {
  id: string;
  roomId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'SYSTEM';
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  user: { id: string; username: string; avatarUrl: string | null; level: number };
  reactions: { id: string; emoji: string; userId: string; user: { username: string } }[];
}

export type ReactionMap = Record<string, { count: number; users: string[] }>;

export const chatApi = {
  getSquares: () =>
    api.get<ChatRoom[]>('/chat/squares').then((r) => r.data),

  getMyRooms: () =>
    api.get<ChatRoom[]>('/chat/rooms').then((r) => r.data),

  getRoom: (roomId: string) =>
    api.get<ChatRoom>(`/chat/rooms/${roomId}`).then((r) => r.data),

  createRoom: (data: { name: string; type: string; description?: string; tagNames?: string[]; memberIds?: string[] }) =>
    api.post<ChatRoom>('/chat/rooms', data).then((r) => r.data),

  joinRoom: (roomId: string) =>
    api.post(`/chat/rooms/${roomId}/join`).then((r) => r.data),

  leaveRoom: (roomId: string) =>
    api.delete(`/chat/rooms/${roomId}/leave`).then((r) => r.data),

  getMessages: (roomId: string, cursor?: string, limit = 50) =>
    api.get<ChatMessage[]>(`/chat/rooms/${roomId}/messages`, { params: { cursor, limit } }).then((r) => r.data),
};
