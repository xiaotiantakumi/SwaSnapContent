import { calculatePoints, calculateStreakDays, evaluateBadges } from './badges';
import { calculateCoins, type CoinBreakdownEntry } from './coins';
import type { AnsweredProblem, LevelId, Operation, SansuSession, SansuUserPublic } from './types';

export type FinishSessionInput = {
  user: SansuUserPublic;
  level: LevelId;
  operation: Operation;
  isDaily: boolean;
  isRetired?: boolean;
  startedAt: number;
  completedAt: number;
  problems: AnsweredProblem[];
  pastSessions: SansuSession[];
};

export type FinishSessionResult = {
  session: SansuSession;
  updatedUser: SansuUserPublic;
  newBadges: string[];
  pointsEarned: number;
  // クライアント楽観表示用のコイン獲得（確定値はサーバー応答 user で上書きする）
  coinsEarned: number;
  coinBreakdown: CoinBreakdownEntry[];
};

export function finishSession(input: FinishSessionInput): FinishSessionResult {
  const {
    user,
    level,
    operation,
    isDaily,
    isRetired = false,
    startedAt,
    completedAt,
    problems,
    pastSessions,
  } = input;

  const correctCount = problems.filter((p) => p.isCorrect).length;
  const durationMs = completedAt - startedAt;

  const sessionId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  const baseSession: SansuSession = {
    id: sessionId,
    userId: user.id,
    userName: user.name,
    level,
    operation,
    isDaily,
    ...(isRetired ? { isRetired: true } : {}),
    startedAt,
    completedAt,
    durationMs,
    totalProblems: problems.length,
    correctCount,
    pointsEarned: 0,
    newBadges: [],
  };

  // リタイヤ（途中終了）は履歴には残すが、回数・ポイント・バッジ・ベストタイムの
  // 集計には加えない（記録の水増し防止）。lastPlayedAt と streak は「練習した事実」
  // として更新する。
  const isCountable = !isRetired;

  const pointsEarned = isCountable ? calculatePoints(baseSession) : 0;
  const session: SansuSession = { ...baseSession, pointsEarned };

  const allSessions = [...pastSessions, session];
  const streak = calculateStreakDays(allSessions, new Date(completedAt));

  const bestKey = `lv${level}:${operation}`;
  const prevBest = user.bestTimesByLevel[bestKey];
  const isPerfect = correctCount === problems.length;
  const isNewBest =
    isCountable && isPerfect && (prevBest === undefined || durationMs < prevBest);
  const newBest = isNewBest ? durationMs : prevBest;

  const intermediateUser: SansuUserPublic = {
    ...user,
    currentStreakDays: streak,
    lastPlayedDate: new Date(completedAt).toISOString().slice(0, 10),
    lastPlayedAt: completedAt,
    totalSessions: isCountable ? user.totalSessions + 1 : user.totalSessions,
    bestTimesByLevel: {
      ...user.bestTimesByLevel,
      ...(newBest !== undefined ? { [bestKey]: newBest } : {}),
    },
  };

  const newBadges = isCountable
    ? evaluateBadges({
        user: intermediateUser,
        session,
        allSessions,
        playedAt: new Date(completedAt),
      })
    : [];

  session.newBadges = newBadges;

  const todayKey = intermediateUser.lastPlayedDate; // = completedAt の YYYY-MM-DD
  const coin = calculateCoins({
    dailyCoinDate: user.dailyCoinDate ?? '',
    dailyCoinsEarned: user.dailyCoinsEarned ?? 0,
    dailySessionCount: user.dailySessionCount ?? 0,
    todayKey,
    isNewBest,
    streakDays: streak,
    prevStreakDays: user.currentStreakDays,
    isCountable,
  });

  const updatedUser: SansuUserPublic = {
    ...intermediateUser,
    earnedBadges: [...intermediateUser.earnedBadges, ...newBadges],
    totalPoints: intermediateUser.totalPoints + pointsEarned,
    coins: (user.coins ?? 0) + coin.coinsEarned,
    dailyCoinDate: coin.nextDailyCoinDate,
    dailyCoinsEarned: coin.nextDailyCoinsEarned,
    dailySessionCount: coin.nextDailySessionCount,
  };

  return {
    session,
    updatedUser,
    newBadges,
    pointsEarned,
    coinsEarned: coin.coinsEarned,
    coinBreakdown: coin.breakdown,
  };
}
