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
