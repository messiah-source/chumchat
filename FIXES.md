# Локальный запуск и исправления багов

## Что было сделано для запуска проекта

Проект требует PostgreSQL и Redis, но Docker отсутствовал.
Установлено через Chocolatey:
- **PostgreSQL 15** — инициализирован в `C:\pgdata`, запущен как Windows-сервис `postgresql-15`
- **Redis (Memurai)** — запущен как Windows-сервис `Memurai`

Создан пользователь и база данных:
```sql
CREATE USER chumchat WITH PASSWORD 'chumchat_dev';
CREATE DATABASE chumchat OWNER chumchat;
ALTER USER chumchat CREATEDB;
```

Настроены `.env` и `backend/.env` из `.env.example`.
Выполнены `npm install`, `prisma migrate dev`, `prisma/seed.ts`.

---

## Исправленные баги

### 1. TypeScript ошибки при компиляции backend

**Проблема:** `backend/src/main.ts` — некорректный cast для `helmet`:
```ts
app.use((helmet as unknown as () => ReturnType<typeof helmet>)());
```
**Причина:** Устаревший способ импорта — `import * as helmet` вместо default import.

**Исправление:** `backend/src/main.ts`
```ts
// было
import * as helmet from 'helmet';
app.use((helmet as unknown as () => ReturnType<typeof helmet>)());

// стало
import helmet from 'helmet';
app.use(helmet());
```

---

**Проблема:** `backend/src/shop/shop.service.ts:100` — TS2352, unsafe cast к `Record<string, string | null>`.

**Исправление:**
```ts
// было
if ((currentEquipped as Record<string, string | null>)[field]) {
// стало
if ((currentEquipped as any)?.[field]) {
```

---

### 2. WebSocket не подключался (статус offline, сообщения не грузились)

**Проблема:** `frontend/src/hooks/useSocket.ts` подключается к `io('/chat', ...)` — относительный URL
идёт на `localhost:5173` (Vite), а не `localhost:3001` (NestJS).
Vite не проксировал `/socket.io` на бэкенд, поэтому все 4 WebSocket-соединения висели в `pending`.

**Исправление:** `frontend/vite.config.ts` — добавлен proxy для socket.io с `ws: true`:
```ts
'/socket.io': { target: 'http://localhost:3001', changeOrigin: true, ws: true },
```

---

**Проблема:** Статус в строке снизу всегда показывал "offline" — брался из `user.status` в БД,
которое обновляется только при рефетче `useMe()`, а не по WebSocket-событию.

**Исправление:** `frontend/src/pages/Chat.tsx` — статус читается из `chatStore.onlineUsers[userId]`,
который обновляется мгновенно при получении события `user_status` от сокета.

---

**Проблема:** Комната без сообщений показывала `"загрузка сообщений..."` вечно —
`isLoading` из `useRoomMessages` не использовался, и `messages.length === 0` не различало
"загружается" от "пусто".

**Исправление:** `frontend/src/pages/Chat.tsx` — разделены состояния loading и empty:
- Загружается → `"загрузка сообщений..."`
- Пусто → `"Нет сообщений. Напиши первым!"`

---

### 3. Дублирование сообщений в чате

**Проблема A (frontend):** `useSocket()` вызывался из трёх мест одновременно —
`Chat.tsx`, `MessageInput`, `useJoinRoom` — каждый вызов создавал отдельный `initialized` ref.
React StrictMode в development дополнительно вызывает effects дважды (mount→cleanup→mount).
Итог: 3–6 socket-соединений → сервер рассылал `new_message` всем соединениям пользователя →
`addMessage` в store вызывался несколько раз для одного сообщения.

**Исправление:** `frontend/src/hooks/useSocket.ts` — флаг `socketInitialized` вынесен в module scope:
```ts
// было: const initialized = useRef(false); — per-component
// стало: let socketInitialized = false; — module-level singleton
```
Cleanup отключает сокет только при реальном logout (`!isAuthenticated`), не при каждом unmount.

---

**Проблема B (frontend):** `chatStore.addMessage` не дедуплицировал — одно и то же сообщение
могло добавляться несколько раз при получении дублирующих `new_message` событий.

**Исправление:** `frontend/src/store/chatStore.ts`:
```ts
addMessage: (msg) =>
  set((s) => {
    const existing = s.messages[msg.roomId] ?? [];
    if (existing.some((m) => m.id === msg.id)) return s; // deduplicate
    return { messages: { ...s.messages, [msg.roomId]: [...existing, msg] } };
  }),
```

---

**Проблема C (backend):** `handleJoin` в `chat.gateway.ts` создавал системное сообщение
`"username вошёл в чат"` при каждом `join_room` событии, без проверки — уже в комнате или нет.
При каждом обновлении страницы накапливались десятки записей в БД.

**Исправление:** `backend/src/chat/chat.gateway.ts` — проверка `socket.rooms.has()` перед созданием:
```ts
const wasAlreadyInRoom = socket.rooms.has(`room:${data.roomId}`);
// ... join ...
if (!wasAlreadyInRoom) {
  // создать и отправить системное сообщение
}
```

---

### 4. Загрузка аватарки не работала

**Проблема:** `frontend/src/api/users.ts` явно устанавливал заголовок `Content-Type: multipart/form-data`
без boundary-параметра. Axios при использовании `FormData` обязан выставить этот заголовок
**самостоятельно** — только тогда он добавит корректный boundary. Multer на сервере не мог
распарсить тело запроса и файл не сохранялся.

**Исправление:** убрать явный заголовок, пусть Axios управляет им сам:
```ts
// было
api.post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
// стало
api.post('/users/me/avatar', form)
```

---

**Проблема:** После успешной загрузки аватара страница профиля не обновлялась —
`useUploadAvatar` инвалидировал только `['me']`, но страница профиля использует
`['profile', username]` как ключ React Query.

**Исправление:** `frontend/src/hooks/useProfile.ts` — хуки `useUploadAvatar` и `useUploadBanner`
принимают `username` и инвалидируют оба ключа.
