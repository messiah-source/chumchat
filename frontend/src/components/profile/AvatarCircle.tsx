import { useRef } from 'react';
import { XpRing } from './XpRing';
import { StatusDot } from '../ui/StatusDot';
import type { PublicProfile } from '../../types';

interface AvatarCircleProps {
  profile: PublicProfile;
  editable?: boolean;
  onAvatarChange?: (file: File) => void;
  size?: number;
}

export function AvatarCircle({ profile, editable = false, onAvatarChange, size = 160 }: AvatarCircleProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const innerSize = size - 28;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAvatarChange?.(file);
  };

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <XpRing level={profile.level} xp={profile.xp} size={size} />

        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={() => editable && fileRef.current?.click()}
        >
          <div
            className="rounded-full overflow-hidden bg-cyber-panel-3 border-2 border-cyber-panel flex items-center justify-center"
            style={{ width: innerSize, height: innerSize }}
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-mono text-4xl text-cyber-text-dim select-none">
                {profile.username[0].toUpperCase()}
              </span>
            )}
            {editable && (
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="font-mono text-xs text-white">ИЗМЕНИТЬ</span>
              </div>
            )}
          </div>
        </div>

        <div className="absolute top-1 right-4">
          <StatusDot status={profile.status} size="md" />
        </div>

        {editable && (
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        )}
      </div>

      <div className="mt-1 px-3 py-0.5 bg-cyber-red rounded-sm font-mono text-white text-xs font-bold">
        {profile.level}
      </div>
    </div>
  );
}
