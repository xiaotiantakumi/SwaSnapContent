export type Operation = 'add' | 'sub' | 'mul' | 'div' | 'mixed';

export type LevelId =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 'mix';

export type Problem = {
  a: number;
  b: number;
  op: Exclude<Operation, 'mixed'>;
  answer: number;
};

export type AnsweredProblem = Problem & {
  userAnswer: number;
  isCorrect: boolean;
  timeMs: number;
};

// アバター装備スロット（ショップ／着せ替え）。
export type ItemSlot = 'hat' | 'background' | 'frame' | 'effect';
// スロットごとに装備中のアイテムID。
export type EquippedItems = Partial<Record<ItemSlot, string>>;

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
  // --- ゲーミフィケーション（全て optional・後方互換。未設定は 0 / [] / {} 扱い） ---
  coins?: number; // 使える残高（totalPoints とは別。増減する）
  ownedItems?: string[]; // 所持アイテムID
  equippedItems?: EquippedItems; // 装備中アイテム
  dailyCoinDate?: string; // 当日コイン集計の対象日 YYYY-MM-DD
  dailyCoinsEarned?: number; // 当日すでに獲得したコイン（1日上限判定）
  dailySessionCount?: number; // 当日のクリア回数（1回目/2回目判定）
  minigameHighScore?: number; // ミニゲーム最高スコア（全体・後方互換）
  minigameScores?: Record<string, number>; // ゲームごとの最高スコア
};

export type SansuUserServer = SansuUserPublic & {
  pinHash: string;
  pinSalt: string;
};

export type SansuSession = {
  id: string;
  userId: string;
  userName: string;
  level: LevelId;
  operation: Operation;
  isDaily: boolean;
  isRetired?: boolean;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  totalProblems: number;
  correctCount: number;
  pointsEarned: number;
  newBadges: string[];
};

export type ThemeColor =
  | 'pink'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'orange';
