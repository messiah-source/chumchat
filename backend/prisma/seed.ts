import { PrismaClient, TagType, RoomType, ShopItemType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.achievement.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Первый вход',    description: 'Добро пожаловать в CHUM.CHAT',    icon: '🚀', xpReward: 50,  coinsReward: 20,  trigger: 'first_login',   triggerValue: 1 },
      { name: 'Болтун',         description: 'Отправил 10 сообщений',            icon: '💬', xpReward: 30,  coinsReward: 10,  trigger: 'messages_10',   triggerValue: 10 },
      { name: 'Оратор',         description: 'Отправил 100 сообщений',           icon: '🎤', xpReward: 100, coinsReward: 50,  trigger: 'messages_100',  triggerValue: 100 },
      { name: 'Легенда эфира',  description: 'Отправил 500 сообщений',           icon: '👑', xpReward: 300, coinsReward: 150, trigger: 'messages_500',  triggerValue: 500 },
      { name: 'Симпатяга',      description: 'Получил 10 лайков',                icon: '❤️', xpReward: 50,  coinsReward: 20,  trigger: 'likes_10',      triggerValue: 10 },
      { name: 'Популярный',     description: 'Получил 50 лайков',                icon: '💫', xpReward: 200, coinsReward: 100, trigger: 'likes_50',      triggerValue: 50 },
      { name: 'Социальный',     description: 'Добавил 5 друзей',                 icon: '🤝', xpReward: 80,  coinsReward: 30,  trigger: 'friends_5',     triggerValue: 5 },
      { name: 'Коллекционер',   description: 'Добавил 10 тегов',                 icon: '🏷️', xpReward: 60,  coinsReward: 25,  trigger: 'tags_10',       triggerValue: 10 },
      { name: 'Старожил',       description: 'Месяц в CHUM.CHAT',                icon: '🏛️', xpReward: 300, coinsReward: 200, trigger: 'month_member',  triggerValue: 30 },
    ],
  });

  await prisma.tag.createMany({
    skipDuplicates: true,
    data: [
      { name: 'геймер', type: TagType.FREE },
      { name: 'программист', type: TagType.FREE },
      { name: 'музыкант', type: TagType.FREE },
      { name: 'художник', type: TagType.FREE },
      { name: 'киберпанк', type: TagType.FREE },
      { name: 'аниме', type: TagType.FREE },
      { name: 'ретро', type: TagType.FREE },
      { name: 'легенда', type: TagType.UNIQUE, maxCount: 10 },
      { name: 'основатель', type: TagType.UNIQUE, maxCount: 100 },
    ],
  });

  // Seed City Squares
  await prisma.chatRoom.createMany({
    skipDuplicates: true,
    data: [
      { id: 'square-global', name: 'Общий чат (Мировой)', description: 'Для всех чамеров без исключений', type: RoomType.SQUARE },
      { id: 'square-gamers', name: 'Геймеры', description: 'Площадь для тех кто в теме', type: RoomType.SQUARE },
      { id: 'square-dev', name: 'Программисты', description: 'Код, баги, кофе', type: RoomType.SQUARE },
      { id: 'square-art', name: 'Художники', description: 'Творчество без границ', type: RoomType.SQUARE },
      { id: 'square-music', name: 'Музыканты', description: 'Звуки киберпространства', type: RoomType.SQUARE },
    ],
  });

  // Link squares to tags
  const gameTag = await prisma.tag.findUnique({ where: { name: 'геймер' } });
  const devTag  = await prisma.tag.findUnique({ where: { name: 'программист' } });

  if (gameTag) {
    await prisma.chatRoomTag.upsert({
      where: { roomId_tagId: { roomId: 'square-gamers', tagId: gameTag.id } },
      create: { roomId: 'square-gamers', tagId: gameTag.id },
      update: {},
    });
  }
  if (devTag) {
    await prisma.chatRoomTag.upsert({
      where: { roomId_tagId: { roomId: 'square-dev', tagId: devTag.id } },
      create: { roomId: 'square-dev', tagId: devTag.id },
      update: {},
    });
  }

  // Seed unique/competitive tags for shop
  await prisma.tag.createMany({
    skipDuplicates: true,
    data: [
      { name: 'нано-мастер',    type: TagType.UNIQUE,      maxCount: 50 },
      { name: 'киберлегенда',   type: TagType.UNIQUE,      maxCount: 25 },
      { name: 'спонсор',        type: TagType.UNIQUE,      maxCount: 100 },
      { name: 'чемпион',        type: TagType.COMPETITIVE, maxCount: null },
      { name: 'ветеран',        type: TagType.COMPETITIVE, maxCount: null },
    ],
  });

  const [nanoTag, legTag, sponsorTag] = await Promise.all([
    prisma.tag.findUnique({ where: { name: 'нано-мастер' } }),
    prisma.tag.findUnique({ where: { name: 'киберлегенда' } }),
    prisma.tag.findUnique({ where: { name: 'спонсор' } }),
  ]);

  // Shop items
  await prisma.shopItem.createMany({
    skipDuplicates: true,
    data: [
      // SKINS
      {
        name: 'Неоновая ночь', description: 'Тёмный фон с пурпурным свечением',
        type: ShopItemType.SKIN, price: 50, rarity: 'common',
        data: { primaryColor: '#6c5ce7', glowColor: '#a29bfe', bgGradient: 'from-purple-950 to-indigo-950' },
      },
      {
        name: 'Кровавый закат', description: 'Красно-оранжевый киберпанк',
        type: ShopItemType.SKIN, price: 80, rarity: 'rare',
        data: { primaryColor: '#FF384F', glowColor: '#ff8c42', bgGradient: 'from-red-950 to-orange-950' },
      },
      {
        name: 'Матрица', description: 'Классический зелёный хакер',
        type: ShopItemType.SKIN, price: 120, rarity: 'epic',
        data: { primaryColor: '#39ff14', glowColor: '#00d4ff', bgGradient: 'from-green-950 to-emerald-950' },
      },
      {
        name: 'Золотая схема', description: 'Легендарный золотой интерфейс',
        type: ShopItemType.SKIN, price: 300, rarity: 'legendary',
        data: { primaryColor: '#ffd700', glowColor: '#ff8c42', bgGradient: 'from-yellow-950 to-amber-950' },
      },
      // DECORATIONS
      {
        name: 'Рамка: Нано', description: 'Тонкая светящаяся нано-рамка аватара',
        type: ShopItemType.DECORATION, price: 40, rarity: 'common',
        data: { frameStyle: 'nano', borderColor: '#00d4ff', animation: 'pulse' },
      },
      {
        name: 'Рамка: Плазма', description: 'Плазменный контур с искрами',
        type: ShopItemType.DECORATION, price: 100, rarity: 'epic',
        data: { frameStyle: 'plasma', borderColor: '#FF384F', animation: 'spark' },
      },
      // BADGES
      {
        name: 'Значок: Донатер', description: 'Поддержал проект',
        type: ShopItemType.BADGE, price: 60, rarity: 'rare',
        data: { emoji: '💎', label: 'Донатер', color: '#4fc3f7' },
      },
    ],
  });

  // TAG shop items
  if (nanoTag) {
    const exists = await prisma.shopItem.findFirst({ where: { tagId: nanoTag.id } });
    if (!exists) {
      await prisma.shopItem.create({
        data: {
          name: 'Тег: нано-мастер', description: 'Уникальный тег для истинных технарей',
          type: ShopItemType.TAG, price: 200, rarity: 'rare',
          tagId: nanoTag.id,
          data: {},
        },
      });
    }
  }
  if (sponsorTag) {
    const exists = await prisma.shopItem.findFirst({ where: { tagId: sponsorTag.id } });
    if (!exists) {
      await prisma.shopItem.create({
        data: {
          name: 'Тег: спонсор', description: 'Поддержал развитие CHUM.CHAT',
          type: ShopItemType.TAG, price: 500, rarity: 'legendary',
          tagId: sponsorTag.id,
          data: {},
        },
      });
    }
  }

  // Sample active contest
  const contestExists = await prisma.contest.findFirst({ where: { title: 'Лучший профиль недели' } });
  if (!contestExists) {
    const endAt = new Date();
    endAt.setDate(endAt.getDate() + 7);
    const champTag = await prisma.tag.findUnique({ where: { name: 'чемпион' } });
    await prisma.contest.create({
      data: {
        title: 'Лучший профиль недели',
        description: 'Заполни профиль, добавь теги и получи голоса. Победитель получит уникальный тег «чемпион» и 500 монет!',
        startAt: new Date(),
        endAt,
        status: 'ACTIVE',
        maxWinners: 3,
        prizeXp: 500,
        prizeCoins: 500,
        prizeTagId: champTag?.id,
        createdBy: 'system',
      },
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
