# CHUM.CHAT — Dev Deploy Guide

## Требования

| Инструмент | Версия | Скачать |
|-----------|--------|---------|
| Node.js   | 20+    | https://nodejs.org |
| Docker Desktop | любая | https://docker.com |
| npm | 9+ | поставляется с Node |

---

## Быстрый старт (PowerShell)

```powershell
cd chumchat

# 1. Первый раз — установка всего
.\setup.ps1

# 2. Каждый раз запускать dev
.\start-dev.ps1

# 3. Остановить
.\stop-dev.ps1
```

`setup.ps1` делает всё автоматически:
- Стартует PostgreSQL + Redis в Docker
- `npm install` в backend и frontend
- `prisma migrate dev` + `prisma generate`
- Запускает seed (ачивки, площади, скины, конкурс)

---

## Ручной запуск (если скрипты не работают)

### 1. База данных и Redis

```powershell
cd chumchat
docker-compose up -d postgres redis
```

### 2. Backend

```powershell
cd chumchat\backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma\seed.ts
npm run start:dev
```

Backend: **http://localhost:3001**

### 3. Frontend (новый терминал)

```powershell
cd chumchat\frontend
npm install
npm run dev
```

Frontend: **http://localhost:5173**

---

## Страницы

| URL | Описание |
|-----|---------|
| `/` | Лендинг (оригинальный дизайн) |
| `/login` | Вход |
| `/register` | Регистрация — «Стать членом» |
| `/profile/:username` | Профиль пользователя |
| `/chat` | Чат (нужна авторизация) |
| `/search` | Поиск по тегам |
| `/leaderboard` | XP-рейтинг |
| `/shop` | Магазин скинов и тегов |
| `/contests` | Конкурсы профилей |
| `/contests/:id` | Конкурс — голосование |

---

## API

### Аутентификация
| | |
|--|--|
| `POST /api/auth/register` | Регистрация |
| `POST /api/auth/login` | Вход |
| `POST /api/auth/refresh` | Обновить access token (из httpOnly cookie) |
| `POST /api/auth/logout` | Выход |

### Профиль
| | |
|--|--|
| `GET /api/users/me` | Мой профиль |
| `GET /api/users/:username` | Публичный профиль |
| `PATCH /api/users/me/profile` | Обновить bio/theme |
| `POST /api/users/me/avatar` | Загрузить аватар (multipart) |
| `POST /api/users/me/banner` | Загрузить баннер |
| `POST /api/users/:id/like` | Лайк/анлайк |
| `POST /api/users/:id/rate` | Оценить 1-5 |
| `GET /api/users/top` | Топ профилей |

### Теги
| | |
|--|--|
| `GET /api/tags/search?q=` | Поиск тегов (автокомплит) |
| `GET /api/tags/popular` | Популярные |
| `GET /api/tags/users?tags[]=` | Поиск юзеров по тегам |
| `GET /api/tags/compatibility/:id1/:id2` | Совместимость 0-100 |
| `POST /api/tags/me` | Добавить тег себе |
| `DELETE /api/tags/me/:tagId` | Удалить тег |

### Чат
| | |
|--|--|
| `GET /api/chat/squares` | Городские площади |
| `GET /api/chat/rooms` | Мои комнаты |
| `POST /api/chat/rooms` | Создать группу/DM |
| `POST /api/chat/rooms/:id/join` | Вступить |
| `GET /api/chat/rooms/:id/messages` | История |

### WebSocket `/chat`
```
Подключение: { auth: { token: "<accessToken>" } }

Клиент → сервер:
  join_room    { roomId }
  send_message { roomId, content }
  edit_message { messageId, content }
  delete_message { messageId }
  toggle_reaction { messageId, emoji, roomId }
  typing_start { roomId }
  typing_stop  { roomId }
  set_status   { status: "ONLINE"|"AFK"|"OFFLINE" }
  start_private { targetUserId, squareId }

Сервер → клиент:
  new_message       — новое сообщение
  message_edited    — отредактировано
  message_deleted   — удалено
  reaction_updated  — реакции обновлены
  typing            — { username, typing, roomId }
  user_status       — { userId, status }
  private_invite    — запрос приватного чата
```

### Геймификация
| | |
|--|--|
| `GET /api/gamification/balance` | Монеты |
| `GET /api/gamification/xp-history` | История XP |
| `POST /api/gamification/daily-login` | Бонус за вход |
| `GET /api/gamification/leaderboard` | XP лидерборд |

### Магазин
| | |
|--|--|
| `GET /api/shop/catalog?type=` | Каталог (SKIN/DECORATION/TAG/BADGE) |
| `GET /api/shop/inventory` | Инвентарь |
| `POST /api/shop/buy` | Купить `{ itemId }` |
| `POST /api/shop/equip` | Надеть `{ inventoryId, slot }` |

### Конкурсы
| | |
|--|--|
| `GET /api/contests?status=ACTIVE` | Список |
| `GET /api/contests/:id` | Конкурс + участники |
| `POST /api/contests/:id/enter` | Записаться |
| `POST /api/contests/entries/:entryId/vote` | Голос |
| `POST /api/contests` | Создать (любой авторизованный) |

---

## XP — таблица начислений

| Действие | XP |
|---------|-----|
| Сообщение в чат | +2 |
| Получить лайк | +5 |
| Получить оценку | +3 |
| Добавить друга | +10 |
| Добавить тег | +2 |
| Ежедневный вход | +20 |
| Ачивка | по условию |
| Повышение уровня | N×10 монет |

---

## Полезные команды

```powershell
# Просмотр БД в браузере
cd backend
npx prisma studio        # → http://localhost:5555

# Сбросить БД (осторожно — удалит данные)
npx prisma migrate reset

# Пересеять данные
npx ts-node prisma\seed.ts

# Посмотреть логи Docker
cd ..
docker-compose logs -f backend

# Полная остановка с удалением данных
docker-compose down -v
```

---

## Структура проекта

```
chumchat/
├── setup.ps1          ← первый запуск
├── start-dev.ps1      ← запуск dev
├── stop-dev.ps1       ← остановка
├── docker-compose.yml ← PostgreSQL + Redis
├── .env               ← переменные окружения
│
├── backend/           ← NestJS API
│   ├── src/
│   │   ├── auth/      ← JWT, register/login/refresh
│   │   ├── users/     ← профиль, аватар, лайки
│   │   ├── tags/      ← теги, поиск, совместимость
│   │   ├── chat/      ← Socket.io, комнаты, сообщения
│   │   ├── friends/   ← друзья, заявки
│   │   ├── gamification/ ← XP, ачивки, уровни
│   │   ├── shop/      ← каталог, покупки
│   │   └── contests/  ← конкурсы, голосование
│   └── prisma/
│       └── schema.prisma
│
└── frontend/          ← React 18 + Tailwind
    └── src/
        ├── pages/     ← Landing, Login, Register, Profile,
        │               Chat, Search, Leaderboard, Shop, Contests
        ├── components/ ← ui/, profile/, chat/, shop/, contests/, gamification/
        ├── hooks/      ← useAuth, useProfile, useTags, useChat,
        │               useSocket, useShop, useContests
        ├── store/      ← authStore, themeStore, chatStore
        └── api/        ← client.ts (axios + refresh), auth, users,
                         tags, chat, shop, contests, gamification
```
