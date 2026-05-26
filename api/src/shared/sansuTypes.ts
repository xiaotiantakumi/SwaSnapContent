export type SansuUserPublic = {
  id: string;
  name: string;
  avatar: string;
  themeColor: string;
  createdAt: number;
  totalPoints: number;
  earnedBadges: string[];
  bestTimesByLevel: Record<string, number>;
  currentStreakDays: number;
  lastPlayedDate: string;
  lastPlayedAt: number;
  totalSessions: number;
  pinResetAt?: number;
  pinResetBy?: string;
};

export type SansuUserEntity = {
  partitionKey: string;
  rowKey: string;
  name: string;
  avatar: string;
  themeColor: string;
  createdAt: number;
  totalPoints: number;
  earnedBadgesJson: string;
  bestTimesJson: string;
  currentStreakDays: number;
  lastPlayedDate: string;
  lastPlayedAt: number;
  totalSessions: number;
  pinHash: string;
  pinSalt: string;
  pinResetAt?: number;
  pinResetBy?: string;
};

export function toPublic(e: SansuUserEntity): SansuUserPublic {
  return {
    id: e.rowKey,
    name: e.name,
    avatar: e.avatar,
    themeColor: e.themeColor,
    createdAt: e.createdAt,
    totalPoints: e.totalPoints,
    earnedBadges: safeParseArray(e.earnedBadgesJson),
    bestTimesByLevel: safeParseObject(e.bestTimesJson),
    currentStreakDays: e.currentStreakDays,
    lastPlayedDate: e.lastPlayedDate,
    lastPlayedAt: e.lastPlayedAt,
    totalSessions: e.totalSessions,
    pinResetAt: e.pinResetAt,
    pinResetBy: e.pinResetBy,
  };
}

function safeParseArray(s: string): string[] {
  try {
    return Array.isArray(JSON.parse(s)) ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

function safeParseObject(s: string): Record<string, number> {
  try {
    const v = JSON.parse(s);
    return typeof v === 'object' && v !== null ? v : {};
  } catch {
    return {};
  }
}

export type SansuSession = {
  id: string;
  userId: string;
  userName: string;
  level: number | 'mix';
  operation: 'add' | 'sub' | 'mul' | 'div' | 'mixed';
  isDaily: boolean;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  totalProblems: number;
  correctCount: number;
  pointsEarned: number;
  newBadges: string[];
};

export type SansuSessionEntity = {
  partitionKey: string;
  rowKey: string;
  id: string;
  userName: string;
  levelStr: string;
  operation: string;
  isDaily: boolean;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  totalProblems: number;
  correctCount: number;
  pointsEarned: number;
  newBadgesJson: string;
};
