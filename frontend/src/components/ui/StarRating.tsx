import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md';
}

export function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const sz = size === 'sm' ? 'text-sm' : 'text-lg';

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${sz} transition-colors duration-100 disabled:cursor-default ${
            (hover || value) >= star ? 'text-cyber-orange' : 'text-cyber-text-muted'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
