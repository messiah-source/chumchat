export const XP_EVENTS = {
  MESSAGE_SENT:       'xp.message_sent',
  REACTION_RECEIVED:  'xp.reaction_received',
  LIKE_RECEIVED:      'xp.like_received',
  RATING_RECEIVED:    'xp.rating_received',
  DAILY_LOGIN:        'xp.daily_login',
  FRIEND_ADDED:       'xp.friend_added',
  TAG_ADDED:          'xp.tag_added',
} as const;

export const XP_VALUES: Record<string, number> = {
  MESSAGE_SENT:      2,
  REACTION_RECEIVED: 1,
  LIKE_RECEIVED:     5,
  RATING_RECEIVED:   3,
  DAILY_LOGIN:       20,
  FRIEND_ADDED:      10,
  TAG_ADDED:         2,
};

export interface XpPayload {
  userId: string;
  reason: keyof typeof XP_VALUES;
  amount?: number; // override default
}

export interface AchievementCheckPayload {
  userId: string;
  trigger: string;
}
