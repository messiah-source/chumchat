export type UserStatus = 'ONLINE' | 'OFFLINE' | 'AFK';
export type TagType = 'FREE' | 'ACHIEVEMENT' | 'UNIQUE' | 'COMPETITIVE';
export type Theme = 'dark' | 'light';

export interface User {
  id: string;
  username: string;
  email?: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  xp: number;
  level: number;
  status: UserStatus;
  theme: Theme;
  createdAt?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
}

export interface UserAchievement {
  id: string;
  achievement: Achievement;
  earnedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  type: TagType;
  maxCount: number | null;
}

export interface UserTag {
  id: string;
  tag: Tag;
  addedAt: string;
}

export interface PublicProfile extends User {
  achievements: UserAchievement[];
  tags: UserTag[];
  avgRating: number | null;
  _count: {
    receivedLikes: number;
    receivedRatings: number;
  };
}

export interface AuthResponse {
  accessToken: string;
  user: Pick<User, 'id' | 'username' | 'email' | 'level' | 'xp' | 'avatarUrl' | 'status'>;
}

export interface ApiError {
  message: string | string[];
  statusCode: number;
}
