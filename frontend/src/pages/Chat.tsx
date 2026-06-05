import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useSocket } from '../hooks/useSocket';
import { useSquares, useMyRooms, useRoomMessages, useJoinRoom } from '../hooks/useChat';
import { useMe } from '../hooks/useProfile';
import { useLogout } from '../hooks/useAuth';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { StatusDot } from '../components/ui/StatusDot';
import { ChumLogo } from '../components/layout/ChumLogo';
import { MessageBubble } from '../components/chat/MessageBubble';
import { MessageInput } from '../components/chat/MessageInput';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import { CreateGroupModal } from '../components/chat/CreateGroupModal';
import type { ChatRoom } from '../api/chat';
import type { UserStatus } from '../types';

type Tab = 'squares' | 'groups' | 'dms';

const TAB_LABELS: Record<Tab, string> = {
  squares: '🏙 Площади',
  groups: '👥 Группы',
  dms: '💬 Личные',
};

function RoomItem({ room, active, onClick }: { room: ChatRoom; active: boolean; onClick: () => void }) {
  const lastMsg = room.messages?.[0];
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 transition-colors border-l-2 ${
        active
          ? 'border-cyber-cyan dark:bg-cyber-panel-2 bg-[#3a5580]'
          : 'border-transparent hover:dark:bg-cyber-panel-2 hover:bg-[#3a5580]'
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono text-xs dark:text-cyber-text text-[#c0d4e8] truncate">{room.name}</span>
        <span className="font-mono text-xs text-cyber-text-muted flex-shrink-0">
          {room._count?.members ?? 0}
        </span>
      </div>
      {lastMsg && (
        <p className="font-sans text-xs text-cyber-text-muted truncate mt-0.5">
          {lastMsg.user.username}: {lastMsg.content}
        </p>
      )}
    </button>
  );
}

export default function Chat() {
  const { user: authUser } = useAuthStore();
  const { data: me } = useMe();
  const { mutate: logout } = useLogout();
  const { joinRoom, setStatus } = useSocket();

  const { activeRoomId, setActiveRoom, typing, onlineUsers } = useChatStore();
  const { data: squares = [] } = useSquares();
  const { data: myRooms = [] } = useMyRooms();
  const { messages, fetchOlder, isLoading: messagesLoading } = useRoomMessages(activeRoomId);
  const { mutate: joinRoomMutation, isPending: joining } = useJoinRoom();

  const [tab, setTab] = useState<Tab>('squares');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const displayUser = me ?? authUser;
  const typingInRoom = activeRoomId ? (typing[activeRoomId] ?? []) : [];

  // Active room info
  const activeSquare = squares.find((r) => r.id === activeRoomId);
  const activeMyRoom = myRooms.find((r) => r.id === activeRoomId);
  const activeRoom = activeSquare ?? activeMyRoom;

  const groups = myRooms.filter((r) => r.type === 'GROUP');
  const dms = myRooms.filter((r) => r.type === 'DM');

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Auto-join first square on load
  useEffect(() => {
    if (!activeRoomId && squares.length > 0) {
      const globalSquare = squares.find((s) => s.id === 'square-global') ?? squares[0];
      handleSelectRoom(globalSquare);
    }
  }, [squares]);

  const handleSelectRoom = (room: ChatRoom) => {
    setActiveRoom(room.id);
    // For squares, just join socket room (no DB membership required)
    joinRoom(room.id);
  };

  const handleJoinGroup = (room: ChatRoom) => {
    joinRoomMutation(room.id, {
      onSuccess: () => handleSelectRoom(room),
    });
  };

  // Infinite scroll upward
  const handleScroll = () => {
    const c = messagesContainerRef.current;
    if (!c || !activeRoomId) return;
    if (c.scrollTop < 50 && messages.length > 0) {
      fetchOlder(messages[0].createdAt);
    }
  };

  return (
    <div className="h-screen dark:bg-cyber-bg-outer bg-[#3a5580] flex overflow-hidden">

      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}

      {/* ── LEFT SIDEBAR ────────────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 flex flex-col dark:bg-cyber-panel bg-[#2d4a6a] border-r dark:border-cyber-border border-[#1e3a5f] relative">
        <div className="absolute left-0 top-16 bottom-16 w-1 bg-cyber-red opacity-50 rounded-r" />

        {/* Logo */}
        <div className="p-4 border-b dark:border-cyber-border border-[#1e3a5f] flex items-center justify-between">
          <ChumLogo />
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-cyber-cyan/60 animate-pulse-slow" />
            <div className="w-2 h-2 rounded-full bg-cyber-cyan/40" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b dark:border-cyber-border border-[#1e3a5f]">
          {(['squares', 'groups', 'dms'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 font-mono text-xs py-2 transition-colors ${
                tab === t
                  ? 'text-cyber-cyan border-b border-cyber-cyan dark:bg-cyber-panel-2 bg-[#3a5580]'
                  : 'dark:text-cyber-text-muted text-[#7a9bb5] hover:text-cyber-cyan'
              }`}
              title={TAB_LABELS[t]}
            >
              {t === 'squares' ? '🏙' : t === 'groups' ? '👥' : '💬'}
            </button>
          ))}
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto py-1">
          {tab === 'squares' && (
            <>
              <p className="font-mono text-xs text-cyber-text-muted px-3 py-1.5 uppercase tracking-widest">Площади</p>
              {squares.map((room) => (
                <RoomItem
                  key={room.id}
                  room={room}
                  active={activeRoomId === room.id}
                  onClick={() => handleSelectRoom(room)}
                />
              ))}
            </>
          )}

          {tab === 'groups' && (
            <>
              <div className="flex items-center justify-between px-3 py-1.5">
                <p className="font-mono text-xs text-cyber-text-muted uppercase tracking-widest">Группы</p>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="font-mono text-xs text-cyber-cyan hover:underline"
                >
                  +
                </button>
              </div>
              {groups.length === 0 ? (
                <p className="font-mono text-xs text-cyber-text-muted px-3 py-2 italic">Нет групп</p>
              ) : (
                groups.map((room) => (
                  <RoomItem
                    key={room.id}
                    room={room}
                    active={activeRoomId === room.id}
                    onClick={() => handleSelectRoom(room)}
                  />
                ))
              )}

              {/* Join public groups */}
              <p className="font-mono text-xs text-cyber-text-muted px-3 py-1.5 mt-2 uppercase tracking-widest border-t dark:border-cyber-border border-[#1e3a5f]">
                Открытые
              </p>
              <Link to="/search" className="block px-3 py-2 font-mono text-xs text-cyber-cyan hover:dark:bg-cyber-panel-2 hover:bg-[#3a5580]">
                🔍 Найти по тегам →
              </Link>
              <Link to="/contests" className="block px-3 py-2 font-mono text-xs dark:text-cyber-text-muted text-[#7a9bb5] hover:text-cyber-orange hover:dark:bg-cyber-panel-2 hover:bg-[#3a5580]">
                🏆 Конкурсы →
              </Link>
              <Link to="/shop" className="block px-3 py-2 font-mono text-xs dark:text-cyber-text-muted text-[#7a9bb5] hover:text-cyber-orange hover:dark:bg-cyber-panel-2 hover:bg-[#3a5580]">
                🛒 Магазин →
              </Link>
            </>
          )}

          {tab === 'dms' && (
            <>
              <p className="font-mono text-xs text-cyber-text-muted px-3 py-1.5 uppercase tracking-widest">Личные чаты</p>
              {dms.length === 0 ? (
                <p className="font-mono text-xs text-cyber-text-muted px-3 py-2 italic">
                  Начни разговор через профиль
                </p>
              ) : (
                dms.map((room) => (
                  <RoomItem
                    key={room.id}
                    room={room}
                    active={activeRoomId === room.id}
                    onClick={() => handleSelectRoom(room)}
                  />
                ))
              )}
            </>
          )}
        </div>

        {/* User block */}
        <div className="border-t dark:border-cyber-border border-[#1e3a5f] p-3">
          <Link to={`/profile/${displayUser?.username}`} className="flex items-center gap-2 group mb-2">
            <div className="w-8 h-8 rounded-full dark:bg-cyber-panel-3 bg-[#4a6a8a] border dark:border-cyber-border border-[#5a7a9a] flex items-center justify-center overflow-hidden flex-shrink-0">
              {displayUser?.avatarUrl ? (
                <img src={displayUser.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-mono text-sm dark:text-cyber-text-dim text-[#c0d4e8]">
                  {displayUser?.username?.[0]?.toUpperCase() ?? '?'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs dark:text-cyber-text text-[#e0edf8] truncate group-hover:text-cyber-cyan transition-colors">
                {displayUser?.username}
              </p>
            </div>
          </Link>

          <div className="flex items-center justify-between">
            <span className="font-mono text-xs px-1.5 py-0.5 bg-cyber-red text-white rounded-sm">
              {displayUser?.level ?? 1}
            </span>
            <div className="flex items-center gap-1">
              <div className="h-1 w-16 dark:bg-cyber-panel-3 bg-[#4a6a8a] rounded-full overflow-hidden">
                <div className="h-full bg-cyber-cyan w-1/3 rounded-full" />
              </div>
            </div>
          </div>

          {/* Status + logout */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-1">
              {(['ONLINE', 'AFK', 'OFFLINE'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  title={s}
                  className="w-4 h-4 rounded-full transition-all hover:scale-110"
                  style={{ background: s === 'ONLINE' ? '#39ff14' : s === 'AFK' ? '#ff8c42' : '#4a6a8a' }}
                />
              ))}
            </div>
            <button
              onClick={() => logout()}
              className="font-mono text-xs text-cyber-text-muted hover:text-cyber-red transition-colors"
              title="Выйти"
            >
              ⏻
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar — favorites/tabs */}
        <div className="flex-shrink-0 dark:bg-cyber-panel-2 bg-[#3a5580] border-b dark:border-cyber-border border-[#1e3a5f] px-4 py-2 flex items-center justify-between">
          <div className="flex gap-2 overflow-x-auto items-center">
            <span className="font-mono text-xs dark:text-cyber-text-dim text-[#a0c4e0]">Избранное:</span>
            {myRooms.slice(0, 4).map((room) => (
              <button
                key={room.id}
                onClick={() => handleSelectRoom(room)}
                className={`font-mono text-xs px-2 py-1 rounded-sm border transition-colors whitespace-nowrap ${
                  activeRoomId === room.id
                    ? 'border-cyber-cyan text-cyber-cyan dark:bg-cyber-panel bg-[#2d4a6a]'
                    : 'dark:border-cyber-border border-[#1e3a5f] dark:text-cyber-text-dim text-[#a0c4e0] hover:border-cyber-cyan hover:text-cyber-cyan'
                }`}
              >
                {room.name.length > 12 ? room.name.slice(0, 12) + '…' : room.name}
              </button>
            ))}
            <Link to="/search" className="font-mono text-xs text-cyber-cyan hover:underline whitespace-nowrap px-2">
              🔍 Поиск
            </Link>
          </div>
          <ThemeToggle />
        </div>

        {/* Room header */}
        {activeRoom ? (
          <div className="flex-shrink-0 dark:bg-cyber-panel bg-[#2d4a6a] border-b dark:border-cyber-border border-[#1e3a5f] px-4 py-2 flex items-center gap-3">
            <div className="w-5 h-5 dark:bg-cyber-panel-3 bg-[#4a6a8a] border dark:border-cyber-border border-[#5a7a9a] rounded-sm" />
            <div>
              <span className="font-mono text-sm dark:text-cyber-text text-[#e0edf8] font-bold">{activeRoom.name}</span>
              {activeRoom.description && (
                <p className="font-mono text-xs text-cyber-text-muted">{activeRoom.description}</p>
              )}
            </div>
            <span className="ml-auto font-mono text-xs text-cyber-text-muted">
              {activeRoom._count?.members ?? 0} участников
            </span>
            {activeRoom.type === 'SQUARE' && activeRoom.tags.length > 0 && (
              <div className="flex gap-1">
                {activeRoom.tags.slice(0, 3).map((rt) => (
                  <span key={rt.id} className="font-mono text-xs px-1.5 py-0.5 border border-cyber-border text-cyber-text-muted rounded-sm">
                    {rt.tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-shrink-0 dark:bg-cyber-panel bg-[#2d4a6a] border-b dark:border-cyber-border border-[#1e3a5f] px-4 py-2">
            <span className="font-mono text-xs text-cyber-text-muted">Выбери комнату</span>
          </div>
        )}

        {/* Messages area */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto dark:bg-cyber-bg-deep bg-[#3a5580] py-2"
        >
          {!activeRoomId ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="font-mono text-cyber-text-muted text-center">
                <p className="text-lg mb-2">CHUM.CHAT</p>
                <p className="text-sm">Выбери площадь или группу слева</p>
              </div>
            </div>
          ) : messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="font-mono text-xs text-cyber-text-muted animate-pulse">загрузка сообщений...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="font-mono text-xs text-cyber-text-muted">Нет сообщений. Напиши первым!</p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const prevMsg = messages[idx - 1];
                const showAvatar = !prevMsg || prevMsg.user.id !== msg.user.id || msg.type === 'SYSTEM';
                return (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    roomId={activeRoomId}
                    showAvatar={showAvatar}
                  />
                );
              })}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        <div className="flex-shrink-0 dark:bg-cyber-bg-deep bg-[#3a5580] px-4">
          <TypingIndicator typingUsers={typingInRoom.filter((u) => u !== displayUser?.username)} />
        </div>

        {/* Message input */}
        <div className="flex-shrink-0 dark:bg-cyber-panel bg-[#2d4a6a] border-t dark:border-cyber-border border-[#1e3a5f] px-4 py-3">
          {activeRoomId ? (
            <MessageInput roomId={activeRoomId} />
          ) : (
            <div className="font-mono text-xs text-cyber-text-muted text-center py-2">
              Выбери комнату для отправки сообщений
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex-shrink-0 dark:bg-cyber-bg-deep bg-[#2d4a6a] border-t dark:border-cyber-border border-[#1e3a5f] px-4 py-1 flex items-center justify-between">
          <div className="w-4 h-4 rounded-full border dark:border-cyber-border border-[#5a7a9a] dark:bg-cyber-panel-3 bg-[#4a6a8a]" />
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs text-cyber-cyan animate-blink">◈</span>
            <span className="font-mono text-xs text-cyber-text-muted">
              {(authUser?.id ? onlineUsers[authUser.id] : displayUser?.status)?.toLowerCase() ?? 'offline'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-pulse-slow" />
          </div>
        </div>
      </main>
    </div>
  );
}
