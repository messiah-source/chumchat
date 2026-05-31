interface TypingIndicatorProps {
  typingUsers: string[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (!typingUsers.length) return null;

  const text =
    typingUsers.length === 1
      ? `${typingUsers[0]} печатает`
      : typingUsers.length === 2
      ? `${typingUsers[0]} и ${typingUsers[1]} печатают`
      : `${typingUsers.length} человека печатают`;

  return (
    <div className="flex items-center gap-2 px-4 py-1 h-6">
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <span className="font-mono text-xs text-cyber-text-muted italic">{text}...</span>
    </div>
  );
}
