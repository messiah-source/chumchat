import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useProfile, useToggleLike, useRateProfile, useUpdateProfile, useUploadAvatar, useUploadBanner } from '../hooks/useProfile';
import { useAddTag, useRemoveTag } from '../hooks/useTags';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { AvatarCircle } from '../components/profile/AvatarCircle';
import { TagBadge } from '../components/profile/TagBadge';
import { TagInput } from '../components/profile/TagInput';
import { AchievementBadge } from '../components/profile/AchievementBadge';
import { CompatibilityWidget } from '../components/profile/CompatibilityWidget';
import { StatusDot } from '../components/ui/StatusDot';
import { StarRating } from '../components/ui/StarRating';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ChumLogo } from '../components/layout/ChumLogo';

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { data: profile, isLoading, error } = useProfile(username ?? '');
  const { user: me } = useAuthStore();
  const { theme } = useThemeStore();

  const isOwner = me?.id === profile?.id;

  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [editBio, setEditBio] = useState(false);
  const [bioVal, setBioVal] = useState('');

  const likeMutation = useToggleLike(profile?.id ?? '', username ?? '');
  const rateMutation = useRateProfile(profile?.id ?? '', username ?? '');
  const updateMutation = useUpdateProfile();
  const avatarMutation = useUploadAvatar(username ?? '');
  const bannerMutation = useUploadBanner(username ?? '');
  const addTagMutation = useAddTag(username ?? '');
  const removeTagMutation = useRemoveTag(username ?? '');

  const bannerRef = useRef<HTMLInputElement>(null);

  if (isLoading) return <ProfileSkeleton />;
  if (error || !profile) return <div className="min-h-screen dark:bg-cyber-bg-outer bg-light-bg-outer flex items-center justify-center font-mono text-cyber-red">Профиль не найден</div>;

  const safeBio = DOMPurify.sanitize(profile.bio ?? '');

  const handleRateSubmit = () => {
    if (!rating) return;
    rateMutation.mutate({ score: rating, comment: ratingComment || undefined });
    setRating(0);
    setRatingComment('');
  };

  const handleBioSave = () => {
    updateMutation.mutate({ bio: bioVal });
    setEditBio(false);
  };

  const handleAvatarChange = (file: File) => avatarMutation.mutate(file);
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) bannerMutation.mutate(file);
  };

  return (
    <div className="min-h-screen dark:bg-cyber-bg-outer bg-[#3a5580] relative overflow-hidden">
      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-3 dark:bg-cyber-panel bg-[#2d4a6a] border-b dark:border-cyber-border border-[#1e3a5f]">
        <ChumLogo />
        <div className="flex items-center gap-4">
          <Link to="/chat" className="font-mono text-sm dark:text-cyber-text-dim text-[#a0c4e0] hover:text-cyber-cyan transition-colors">ЧАТ</Link>
          <Link to={`/profile/${me?.username}`} className="font-mono text-sm dark:text-cyber-text-dim text-[#a0c4e0] hover:text-cyber-cyan transition-colors">МОЙ ПРОФИЛЬ</Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* BANNER */}
      <div className="relative h-36 overflow-hidden cursor-pointer group" onClick={() => isOwner && bannerRef.current?.click()}>
        {profile.bannerUrl ? (
          <img src={profile.bannerUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full dark:bg-gradient-to-r dark:from-cyber-bg-deep dark:via-cyber-panel dark:to-cyber-bg-deep bg-gradient-to-r from-[#2d4a6a] via-[#3a5580] to-[#2d4a6a]">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.1) 2px, rgba(0,212,255,0.1) 4px)'
            }} />
          </div>
        )}
        {isOwner && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="font-mono text-xs text-white">ИЗМЕНИТЬ БАННЕР</span>
          </div>
        )}
        <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
        {/* Side accent bars */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-cyber-red opacity-80" />
        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-cyber-red opacity-80" />
      </div>

      {/* MAIN CONTENT — matches CC_DARK_PROFILE layout */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 pb-12">

        {/* PROFILE HEADER ROW */}
        <div className="relative flex flex-col items-center -mt-20 mb-6">
          {/* Avatar centered */}
          <AvatarCircle
            profile={profile}
            editable={isOwner}
            onAvatarChange={handleAvatarChange}
            size={160}
          />

          {/* Username + status */}
          <div className="flex items-center gap-3 mt-3">
            <h1 className="font-mono text-2xl dark:text-cyber-text text-[#1a2a3a] font-bold">
              {profile.username}
            </h1>
            <StatusDot status={profile.status} showLabel />
          </div>

          {/* XP bar */}
          <div className="w-48 mt-2">
            <div className="flex justify-between font-mono text-xs dark:text-cyber-text-dim text-[#3a5a7a] mb-1">
              <span>XP: {profile.xp}</span>
              <span>LVL {profile.level}</span>
            </div>
            <div className="h-1.5 dark:bg-cyber-panel-2 bg-[#b0c4d8] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-cyan-dim rounded-full transition-all duration-500"
                style={{ width: `${Math.min((profile.xp % (profile.level * profile.level * 100)) / (profile.level * profile.level * 100) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* THREE-COLUMN LAYOUT matching mockup */}
        <div className="grid grid-cols-[200px_1fr_200px] gap-4">

          {/* LEFT PANEL */}
          <div className="flex flex-col gap-3">
            {/* Stats */}
            <div className="dark:bg-cyber-panel bg-light-panel border dark:border-cyber-border border-light-border rounded-sm p-4">
              <div className="flex gap-1 mb-3">
                <div className="flex-1 h-0.5 dark:bg-cyber-border bg-light-border" />
                <div className="w-4 h-0.5 bg-cyber-cyan" />
              </div>
              <div className="space-y-2 font-mono text-xs dark:text-cyber-text-dim text-light-text-dim">
                <div className="flex justify-between">
                  <span>ЛАЙКИ</span>
                  <span className="text-cyber-red font-bold">♥ {profile._count.receivedLikes}</span>
                </div>
                <div className="flex justify-between">
                  <span>РЕЙТИНГ</span>
                  <span className="text-cyber-orange">
                    {profile.avgRating ? `★ ${profile.avgRating.toFixed(1)}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>В СЕТИ С</span>
                  <span>{new Date(profile.createdAt ?? '').toLocaleDateString('ru')}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="dark:bg-cyber-panel bg-light-panel border dark:border-cyber-border border-light-border rounded-sm p-4">
              <p className="font-mono text-xs dark:text-cyber-text-muted text-light-text-dim uppercase tracking-widest mb-2">Теги</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {profile.tags.map((ut) => (
                  <TagBadge
                    key={ut.id}
                    tag={ut.tag}
                    onRemove={isOwner && (ut.tag.type === 'FREE' || ut.tag.type === 'COMPETITIVE')
                      ? () => removeTagMutation.mutate(ut.tag.id)
                      : undefined
                    }
                  />
                ))}
                {profile.tags.length === 0 && (
                  <span className="font-mono text-xs dark:text-cyber-text-muted text-light-text-dim italic">нет тегов</span>
                )}
              </div>
              {isOwner && (
                <TagInput
                  onAdd={(name) => addTagMutation.mutate(name)}
                  loading={addTagMutation.isPending}
                  error={addTagMutation.error
                    ? ((addTagMutation.error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Ошибка')
                    : null
                  }
                />
              )}
            </div>

            {/* Actions for visitor */}
            {!isOwner && me && (
              <div className="dark:bg-cyber-panel bg-light-panel border dark:border-cyber-border border-light-border rounded-sm p-4 flex flex-col gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => likeMutation.mutate()}
                  loading={likeMutation.isPending}
                  className="w-full"
                >
                  ♥ ЛАЙК
                </Button>
              </div>
            )}
          </div>

          {/* CENTER — main info panel */}
          <div className="dark:bg-cyber-panel bg-light-panel border dark:border-cyber-border border-light-border rounded-sm min-h-96 relative overflow-hidden">
            {/* Decorative wires top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyber-cyan/20 to-transparent" />

            <div className="p-6">
              {/* Bio section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs dark:text-cyber-text-muted text-light-text-dim uppercase tracking-widest">О себе</span>
                  {isOwner && (
                    <button
                      onClick={() => { setEditBio(true); setBioVal(profile.bio ?? ''); }}
                      className="font-mono text-xs text-cyber-cyan hover:underline"
                    >
                      ред.
                    </button>
                  )}
                </div>
                {editBio ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={bioVal}
                      onChange={(e) => setBioVal(e.target.value)}
                      maxLength={500}
                      rows={4}
                      className="w-full bg-cyber-panel-2 border border-cyber-border rounded-sm font-sans text-sm text-cyber-text p-2 focus:outline-none focus:border-cyber-cyan resize-none"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleBioSave} loading={updateMutation.isPending}>Сохранить</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditBio(false)}>Отмена</Button>
                    </div>
                  </div>
                ) : (
                  <p
                    className="font-sans text-sm dark:text-cyber-text text-light-text leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: safeBio || '<span class="text-cyber-text-muted italic">Нет описания</span>' }}
                  />
                )}
              </div>

              {/* Achievements */}
              {profile.achievements.length > 0 && (
                <div className="mb-6">
                  <p className="font-mono text-xs dark:text-cyber-text-muted text-light-text-dim uppercase tracking-widest mb-2">Достижения</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.achievements.map((ua) => (
                      <AchievementBadge key={ua.id} achievement={ua.achievement} earnedAt={ua.earnedAt} />
                    ))}
                  </div>
                </div>
              )}

              {/* Rate section */}
              {!isOwner && me && (
                <div className="border-t dark:border-cyber-border border-light-border pt-4 mt-4">
                  <p className="font-mono text-xs dark:text-cyber-text-muted text-light-text-dim uppercase tracking-widest mb-3">Оценить профиль</p>
                  <StarRating value={rating} onChange={setRating} />
                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Комментарий (необязательно)"
                    maxLength={300}
                    rows={2}
                    className="mt-2 w-full dark:bg-cyber-panel-2 bg-light-panel-2 border dark:border-cyber-border border-light-border rounded-sm font-sans text-sm dark:text-cyber-text text-light-text p-2 focus:outline-none focus:border-cyber-cyan resize-none placeholder-cyber-text-muted"
                  />
                  <Button size="sm" className="mt-2" onClick={handleRateSubmit} disabled={!rating} loading={rateMutation.isPending}>
                    ОТПРАВИТЬ
                  </Button>
                </div>
              )}
            </div>

            {/* Decorative bottom orbs — from mockup */}
            <div className="absolute bottom-4 left-4 w-6 h-6 rounded-full bg-cyber-cyan shadow-glow-cyan opacity-60" />
            <div className="absolute bottom-4 right-4 w-6 h-6 rounded-full bg-cyber-cyan shadow-glow-cyan opacity-60" />
          </div>

          {/* RIGHT PANEL */}
          <div className="flex flex-col gap-3">
            {/* Theme toggle */}
            <div className="dark:bg-cyber-panel bg-light-panel border dark:border-cyber-border border-light-border rounded-sm p-4">
              <div className="flex gap-1 mb-3">
                <div className="w-4 h-0.5 bg-cyber-cyan" />
                <div className="flex-1 h-0.5 dark:bg-cyber-border bg-light-border" />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs dark:text-cyber-text-dim text-light-text-dim">ТЕМА</span>
                <ThemeToggle />
              </div>
            </div>

            {/* Member since */}
            <div className="dark:bg-cyber-panel bg-light-panel border dark:border-cyber-border border-light-border rounded-sm p-4">
              <p className="font-mono text-xs dark:text-cyber-text-muted text-light-text-dim uppercase tracking-widest mb-2">Чамер с</p>
              <p className="font-mono text-sm dark:text-cyber-text text-light-text">
                {new Date(profile.createdAt ?? '').toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Compatibility (for visitors) */}
            {!isOwner && me && profile && (
              <CompatibilityWidget targetUserId={profile.id} targetUsername={profile.username} />
            )}

            {/* Navigation */}
            <div className="dark:bg-cyber-panel bg-light-panel border dark:border-cyber-border border-light-border rounded-sm p-4">
              <Link to="/chat" className="block font-mono text-xs text-cyber-cyan hover:underline mb-2">→ ПЕРЕЙТИ В ЧАТ</Link>
              <Link to="/search" className="block font-mono text-xs dark:text-cyber-text-dim text-light-text-dim hover:text-cyber-cyan hover:underline mb-2">→ ПОИСК ПО ТЕГАМ</Link>
              <Link to="/leaderboard" className="block font-mono text-xs dark:text-cyber-text-dim text-light-text-dim hover:text-cyber-cyan hover:underline">→ РЕЙТИНГ</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative frame elements — matching mockup's robot frame */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 w-2 h-32 dark:bg-cyber-red bg-cyber-red opacity-70 rounded-r-sm" />
      <div className="fixed right-0 top-1/2 -translate-y-1/2 w-2 h-32 dark:bg-cyber-red bg-cyber-red opacity-70 rounded-l-sm" />
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen dark:bg-cyber-bg-outer bg-[#3a5580] flex items-center justify-center">
      <div className="font-mono text-cyber-text-dim animate-pulse">ЗАГРУЗКА ПРОФИЛЯ...</div>
    </div>
  );
}
