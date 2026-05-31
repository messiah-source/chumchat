import { useState } from 'react';
import { useCreateRoom } from '../../hooks/useChat';
import { useChatStore } from '../../store/chatStore';
import { Button } from '../ui/Button';

interface CreateGroupModalProps {
  onClose: () => void;
}

export function CreateGroupModal({ onClose }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [tags, setTags] = useState('');
  const { mutate: create, isPending, error } = useCreateRoom();
  const { setActiveRoom } = useChatStore();

  const submit = () => {
    if (!name.trim()) return;
    create(
      {
        name: name.trim(),
        type: 'GROUP',
        description: desc.trim() || undefined,
        tagNames: tags.split(',').map((t) => t.trim()).filter(Boolean),
      },
      {
        onSuccess: (room) => {
          setActiveRoom(room.id);
          onClose();
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="dark:bg-cyber-panel bg-light-panel border dark:border-cyber-border border-light-border rounded-sm p-6 w-full max-w-md shadow-cyber"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-sm dark:text-cyber-text text-light-text uppercase tracking-widest">
            Создать группу
          </h2>
          <button onClick={onClose} className="font-mono text-cyber-text-muted hover:text-cyber-red">✕</button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="font-mono text-xs text-cyber-text-muted uppercase tracking-widest block mb-1">Название</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Мои корешки"
              maxLength={60}
              className="w-full font-mono text-sm dark:bg-cyber-panel-2 bg-light-panel-2 border dark:border-cyber-border border-light-border rounded-sm px-3 py-2 dark:text-cyber-text text-light-text focus:outline-none focus:border-cyber-cyan"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-cyber-text-muted uppercase tracking-widest block mb-1">
              Описание
            </label>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="О чём эта группа"
              maxLength={300}
              className="w-full font-mono text-sm dark:bg-cyber-panel-2 bg-light-panel-2 border dark:border-cyber-border border-light-border rounded-sm px-3 py-2 dark:text-cyber-text text-light-text focus:outline-none focus:border-cyber-cyan"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-cyber-text-muted uppercase tracking-widest block mb-1">
              Теги для вступления (через запятую)
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="геймер, программист"
              className="w-full font-mono text-sm dark:bg-cyber-panel-2 bg-light-panel-2 border dark:border-cyber-border border-light-border rounded-sm px-3 py-2 dark:text-cyber-text text-light-text focus:outline-none focus:border-cyber-cyan"
            />
            <p className="font-mono text-xs text-cyber-text-muted mt-1">
              Оставь пустым — открытая группа. Нужен хотя бы 1 совпадающий тег.
            </p>
          </div>

          {error && (
            <p className="font-mono text-xs text-cyber-red">
              {(error as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Ошибка'}
            </p>
          )}

          <div className="flex gap-2 mt-2">
            <Button onClick={submit} loading={isPending} className="flex-1">СОЗДАТЬ</Button>
            <Button variant="ghost" onClick={onClose}>Отмена</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
