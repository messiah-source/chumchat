const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '💯', '🎉', '👀', '🤔', '💀'];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
}

export function ReactionPicker({ onSelect }: ReactionPickerProps) {
  return (
    <div className="dark:bg-cyber-panel bg-light-panel border dark:border-cyber-border border-light-border rounded-sm p-2 grid grid-cols-6 gap-1 shadow-cyber">
      {EMOJIS.map((e) => (
        <button
          key={e}
          onClick={() => onSelect(e)}
          className="w-7 h-7 flex items-center justify-center text-base hover:dark:bg-cyber-panel-2 hover:bg-light-panel-2 rounded-sm transition-colors"
        >
          {e}
        </button>
      ))}
    </div>
  );
}
