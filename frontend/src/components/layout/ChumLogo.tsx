import { Link } from 'react-router-dom';

export function ChumLogo() {
  return (
    <Link to="/" className="flex items-end gap-0.5 group select-none">
      {(['C', 'H', 'U', 'M'] as const).map((letter) => (
        <img
          key={letter}
          src={`/assets/${letter}.png`}
          alt={letter}
          className="h-8 w-auto group-hover:scale-110 transition-transform duration-150"
          style={{ imageRendering: 'pixelated' }}
        />
      ))}
    </Link>
  );
}
