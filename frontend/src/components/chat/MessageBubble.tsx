import { useState } from 'react';
import DOMPurify from 'dompurify';
import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/authStore';
import type { ChatMessage } from '../../api/chat';
import { ReactionPicker } from './ReactionPicker';

const USER_BADGE_COLORS = [
  'bg-[#6c5ce7]', 'bg-[#e17055]', 'bg-[#00cec9]', 'bg-[#fd79a8]',
  'bg-[#fdcb6e]', 'bg-[#55efc4]', 'bg-[#74b9ff]', 'bg-[#a29bfe]',
];

function colorForUser(username: string): string {
  let h = 0;
  for (let i = 0; i < username.length; i++) h = ((h << 5) - h) + username.charCodeAt(i);
  return USER_BADGE_COLORS[Math.abs(h) % USER_BADGE_COLORS.length];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
}

interface MessageBubbleProps {
  msg: ChatMessage;
  roomId: string;
  showAvatar?: boolean;
}

export function MessageBubble({ msg, roomId, showAvatar = true }: MessageBubbleProps) {
  const { user: me } = useAuthStore();
  const { toggleReaction, deleteMessage } = useSocket();
  const [showActions, setShowActions] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(msg.content);
  const { editMessage } = useSocket();

  const isMe = msg.user.id === me?.id;
  const isDeleted = !!msg.deletedAt;
  const isSystem = msg.type === 'SYSTEM';

  if (isSystem) {
    return (
      <div className="flex justify-center my-1">
        <span className="font-mono text-xs text-cyber-text-muted px-3 py-0.5 dark:bg-cyber-panel bg-light-panel border dark:border-cyber-border border-light-border rounded-full">
          {DOMPurify.sanitize(msg.content)}
        </span>
      </div>
    );
  }

  // Group reactions by emoji
  const reactionGroups: Record<string, { count: number; mine: boolean }> = {};
  for (const r of msg.reactions) {
    if (!reactionGroups[r.emoji]) reactionGroups[r.emoji] = { count: 0, mine: false };
    reactionGroups[r.emoji].count++;
    if (r.userId === me?.id) reactionGroups[r.emoji].mine = true;
  }

  const handleEditSubmit = () => {
    if (editContent.trim() && editContent !== msg.content) {
      editMessage(msg.id, editContent);
    }
    setEditing(false);
  };

  return (
    <div
      className="flex gap-2 items-start group relative py-0.5 px-2 hover:dark:bg-cyber-panel/30 hover:bg-black/5 rounded-sm transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowPicker(false); }}
    >
      {/* Avatar */}
      {showAvatar ? (
        <div className="w-7 h-7 rounded-full dark:bg-cyber-panel-3 bg-light-panel-3 border dark:border-cyber-border border-light-border flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden">
          {msg.user.avatarUrl ? (
            <img src={msg.user.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-mono text-xs dark:text-cyber-text-dim text-light-text-dim">
              {msg.user.username[0].toUpperCase()}
            </span>
          )}
        </div>
      ) : (
        <div className="w-7 flex-shrink-0" />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {showAvatar && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className={`font-mono text-xs text-white px-1.5 py-0.5 rounded-sm ${colorForUser(msg.user.username)}`}>
              {msg.user.username}
            </span>
            <span className="font-mono text-xs text-cyber-text-muted">{formatTime(msg.createdAt)}</span>
            {msg.editedAt && <span className="font-mono text-xs text-cyber-text-muted italic">(ред.)</span>}
          </div>
        )}

        {editing ? (
          <div className="flex gap-2 mt-1">
            <input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEditSubmit();
                if (e.key === 'Escape') setEditing(false);
              }}
              className="flex-1 font-sans text-sm dark:bg-cyber-panel-3 bg-light-panel-3 border border-cyber-cyan rounded-sm px-2 py-1
                dark:text-cyber-text text-light-text focus:outline-none"
              autoFocus
            />
            <button onClick={handleEditSubmit} className="font-mono text-xs text-cyber-cyan px-2">✓</button>
            <button onClick={() => setEditing(false)} className="font-mono text-xs text-cyber-red px-2">✗</button>
          </div>
        ) : (
          <p className={`font-sans text-sm leading-relaxed dark:text-cyber-text text-light-text break-words ${isDeleted ? 'italic text-cyber-text-muted' : ''}`}>
            {isDeleted ? '[удалено]' : DOMPurify.sanitize(msg.content)}
          </p>
        )}

        {/* Reactions */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(reactionGroups).map(([emoji, data]) => (
              <button
                key={emoji}
                onClick={() => toggleReaction(msg.id, emoji, roomId)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-sm border text-xs transition-colors ${
                  data.mine
                    ? 'border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan'
                    : 'dark:border-cyber-border border-light-border dark:text-cyber-text-dim text-light-text-dim hover:border-cyber-cyan'
                }`}
              >
                {emoji} <span className="font-mono">{data.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {showActions && !isDeleted && (
        <div className="absolute right-2 top-0.5 flex gap-1 dark:bg-cyber-panel bg-light-panel border dark:border-cyber-border border-light-border rounded-sm px-1 py-0.5 z-10">
          <button
            onClick={() => setShowPicker((v) => !v)}
            className="font-mono text-xs dark:text-cyber-text-dim text-light-text-dim hover:text-cyber-cyan px-1"
            title="Реакция"
          >
            😊
          </button>
          {isMe && (
            <>
              <button
                onClick={() => { setEditing(true); setShowActions(false); }}
                className="font-mono text-xs dark:text-cyber-text-dim text-light-text-dim hover:text-cyber-cyan px-1"
                title="Редактировать"
              >
                ✏
              </button>
              <button
                onClick={() => deleteMessage(msg.id)}
                className="font-mono text-xs text-cyber-text-muted hover:text-cyber-red px-1"
                title="Удалить"
              >
                ✕
              </button>
            </>
          )}
        </div>
      )}

      {showPicker && (
        <div className="absolute right-2 top-8 z-20">
          <ReactionPicker onSelect={(emoji) => { toggleReaction(msg.id, emoji, roomId); setShowPicker(false); }} />
        </div>
      )}
    </div>
  );
}
