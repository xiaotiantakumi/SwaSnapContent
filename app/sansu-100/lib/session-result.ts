import { calculatePoints, calculateStreakDays, evaluateBadges } from './badges';
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

  const pointsEarned = calculatePoints(baseSession);
  const session: SansuSession = { ...baseSession, pointsEarned };

  const allSessions = [...pastSessions, session];
  const streak = calculateStreakDays(allSessions, new Date(completedAt));

  const bestKey = `lv${level}:${operation}`;
  const prevBest = user.bestTimesByLevel[bestKey];
  const isPerfect = correctCount === problems.length;
  const newBest =
    isPerfect && (!prevBest || durationMs < prevBest) ? durationMs : prevBest;

  const intermediateUser: SansuUserPublic = {
    ...user,
    currentStreakDays: streak,
    lastPlayedDate: new Date(completedAt).toISOString().slice(0, 10),
    lastPlayedAt: completedAt,
    totalSessions: user.totalSessions + 1,
    bestTimesByLevel: {
      ...user.bestTimesByLevel,
      ...(newBest !== undefined ? { [bestKey]: newBest } : {}),
    },
  };

  const newBadges = evaluateBadges({
    user: intermediateUser,
    session,
    allSessions,
    playedAt: new Date(completedAt),
  });

  session.newBadges = newBadges;

  const updatedUser: SansuUserPublic = {
    ...intermediateUser,
    earnedBadges: [...intermediateUser.earnedBadges, ...newBadges],
    totalPoints: intermediateUser.totalPoints + pointsEarned,
  };

  return { session, updatedUser, newBadges, pointsEarned };
}
