// アバター装備スロット（クライアント lib/types.ts と同期）。
export type ItemSlot = 'hat' | 'background' | 'frame' | 'effect';
export type EquippedItems = Partial<Record<ItemSlot, string>>;

export type { AvatarConfig } from './avatarOptions';
import type { AvatarConfig } from './avatarOptions';

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
  // --- ゲーミフィケーション（全て optional・後方互換） ---
  coins?: number;
  ownedItems?: string[];
  equippedItems?: EquippedItems;
  dailyCoinDate?: string;
  dailyCoinsEarned?: number;
  dailySessionCount?: number;
  minigameHighScore?: number;
  minigameScores?: Record<string, number>;
  avatarConfig?: AvatarConfig;
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
  // --- ゲーミフィケーション。配列/objは JSON文字列カラムで保持（既存 *Json と同方式） ---
  coins?: number;
  ownedItemsJson?: string;
  equippedItemsJson?: string;
  dailyCoinDate?: string;
  dailyCoinsEarned?: number;
  dailySessionCount?: number;
  minigameHighScore?: number;
  minigameScoresJson?: string;
  avatarConfigJson?: string;
  // --- フィーバー(おすすめ問題達成)＋ルーレット倍率 ---
  lastFeverInterval?: number; // 最後にルーレットを使った15分枠（重複防止）
  pendingFeverInterval?: number; // フィーバー達成済みで未claimの枠（-1=なし）
  pendingFeverBase?: number; // その達成セッションで得た基本コイン（倍率の対象）
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
    // ゲーミフィケーション（未設定の既存ユーザーは 0 / [] / {} にフォールバック）
    coins: e.coins ?? 0,
    ownedItems: safeParseArray(e.ownedItemsJson ?? '[]'),
    equippedItems: safeParseEquipped(e.equippedItemsJson ?? '{}'),
    dailyCoinDate: e.dailyCoinDate ?? '',
    dailyCoinsEarned: e.dailyCoinsEarned ?? 0,
    dailySessionCount: e.dailySessionCount ?? 0,
    minigameHighScore: e.minigameHighScore ?? 0,
    minigameScores: safeParseObject(e.minigameScoresJson ?? '{}'),
    avatarConfig: safeParseAvatarConfig(e.avatarConfigJson),
  };
}

function safeParseAvatarConfig(s: string | undefined): AvatarConfig | undefined {
  if (!s) return undefined;
  try {
    const v = JSON.parse(s);
    return typeof v === 'object' && v !== null ? (v as AvatarConfig) : undefined;
  } catch {
    return undefined;
  }
}

function safeParseEquipped(s: string): EquippedItems {
  try {
    const v = JSON.parse(s);
    return typeof v === 'object' && v !== null ? (v as EquippedItems) : {};
  } catch {
    return {};
  }
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
