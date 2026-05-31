import { useState, useRef, useCallback, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';

interface MessageInputProps {
  roomId: string;
  disabled?: boolean;
}

export function MessageInput({ roomId, disabled }: MessageInputProps) {
  const [content, setContent] = useState('');
  const { sendMessage, startTyping, stopTyping } = useSocket();
  const typingRef = useRef(false);
  const stopTimerRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    if (!typingRef.current) {
      typingRef.current = true;
      startTyping(roomId);
    }

    clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(() => {
      typingRef.current = false;
      stopTyping(roomId);
    }, 2000);
  };

  const submit = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;
    sendMessage(roomId, trimmed);
    setContent('');
    typingRef.current = false;
    stopTyping(roomId);
    clearTimeout(stopTimerRef.current);
    textareaRef.current?.focus();
  }, [content, roomId, disabled, sendMessage, stopTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [content]);

  return (
    <div className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Напиши сообщение... (Enter — отправить, Shift+Enter — новая строка)"
        rows={1}
        className="flex-1 resize-none font-sans text-sm dark:bg-cyber-panel-3 bg-light-panel-3
          border dark:border-cyber-border border-light-border rounded-sm px-3 py-2
          dark:text-cyber-text text-light-text dark:placeholder-cyber-text-muted placeholder-light-text-dim
          focus:outline-none focus:border-cyber-cyan transition-colors overflow-hidden"
      />
      <button
        onClick={submit}
        disabled={!content.trim() || disabled}
        className="w-10 h-10 flex-shrink-0 dark:bg-cyber-cyan/20 bg-cyber-cyan hover:bg-cyber-cyan transition-colors
          border border-cyber-cyan rounded-sm flex items-center justify-center
          disabled:opacity-30 disabled:cursor-not-allowed"
        title="Отправить (Enter)"
      >
        <span className="dark:text-cyber-cyan text-white font-bold text-sm">▶</span>
      </button>
    </div>
  );
}
