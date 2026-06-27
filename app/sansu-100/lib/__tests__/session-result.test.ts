import { describe, expect, it } from 'vitest';

import { finishSession } from '../session-result';
import type { AnsweredProblem, SansuUserPublic } from '../types';

function mkUser(over: Partial<SansuUserPublic> = {}): SansuUserPublic {
  return {
    id: 'u1',
    name: 'てすと',
    avatar: '🦊',
    themeColor: 'blue',
    createdAt: 0,
    totalPoints: 0,
    earnedBadges: [],
    bestTimesByLevel: {},
    currentStreakDays: 0,
    lastPlayedDate: '',
    lastPlayedAt: 0,
    totalSessions: 0,
    ...over,
  };
}

function mkProblems(n: number, allCorrect = true): AnsweredProblem[] {
  return Array.from({ length: n }, (_, i) => ({
    a: 1,
    b: 1,
    op: 'add' as const,
    answer: 2,
    userAnswer: allCorrect ? 2 : 0,
    isCorrect: allCorrect,
    timeMs: 1000,
  }));
}

const base = {
  level: 1 as const,
  operation: 'add' as const,
  isDaily: false,
  startedAt: 0,
  completedAt: 25_000,
  pastSessions: [],
};

describe('finishSession - 通常完走', () => {
  it('回数・ポイント・バッジを加算する', () => {
    const user = mkUser();
    const r = finishSession({ ...base, user, problems: mkProblems(100) });
    expect(r.updatedUser.totalSessions).toBe(1);
    expect(r.pointsEarned).toBeGreaterThan(0);
    expect(r.updatedUser.totalPoints).toBe(r.pointsEarned);
    expect(r.newBadges).toContain('sessions_1');
  });
});

describe('finishSession - リタイヤ(isRetired) は集計に加えない', () => {
  it('totalSessions / totalPoints / バッジ を増やさない', () => {
    const user = mkUser();
    const r = finishSession({
      ...base,
      user,
      isRetired: true,
      problems: mkProblems(3),
    });
    expect(r.updatedUser.totalSessions).toBe(0);
    expect(r.pointsEarned).toBe(0);
    expect(r.updatedUser.totalPoints).toBe(0);
    expect(r.newBadges).toEqual([]);
    expect(r.updatedUser.earnedBadges).toEqual([]);
  });

  it('全問正解でリタイヤしてもベストタイムを更新しない', () => {
    const user = mkUser();
    const r = finishSession({
      ...base,
      user,
      isRetired: true,
      problems: mkProblems(3, true),
    });
    expect(r.updatedUser.bestTimesByLevel['lv1:add']).toBeUndefined();
  });

  it('セッション自体は記録として残り isRetired を持つ', () => {
    const user = mkUser();
    const r = finishSession({
      ...base,
      user,
      isRetired: true,
      problems: mkProblems(3),
    });
    expect(r.session.isRetired).toBe(true);
    expect(r.session.totalProblems).toBe(3);
    expect(r.updatedUser.lastPlayedAt).toBe(25_000);
  });
});
