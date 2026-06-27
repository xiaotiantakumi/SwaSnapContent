import { describe, it, expect } from 'vitest';
import {
  evaluateBadges,
  calculateStreakDays,
  calculatePoints,
  type BadgeEvalContext,
} from '../badges';
import { BADGE_CATALOG } from '../badge-catalog';
import type { SansuSession, SansuUserPublic } from '../types';

function mkUser(overrides: Partial<SansuUserPublic> = {}): SansuUserPublic {
  return {
    id: 'u1',
    name: 'tester',
    avatar: '🦊',
    themeColor: 'blue',
    createdAt: Date.now(),
    totalPoints: 0,
    earnedBadges: [],
    bestTimesByLevel: {},
    currentStreakDays: 0,
    lastPlayedDate: '2026-05-25',
    lastPlayedAt: Date.now(),
    totalSessions: 0,
    ...overrides,
  };
}

function mkSession(overrides: Partial<SansuSession> = {}): SansuSession {
  return {
    id: 's1',
    userId: 'u1',
    userName: 'tester',
    level: 1,
    operation: 'add',
    isDaily: false,
    startedAt: 0,
    completedAt: 100_000,
    durationMs: 100_000,
    totalProblems: 100,
    correctCount: 90,
    pointsEarned: 0,
    newBadges: [],
    ...overrides,
  };
}

function mkCtx(overrides: Partial<BadgeEvalContext> = {}): BadgeEvalContext {
  return {
    user: mkUser(),
    session: mkSession(),
    allSessions: [mkSession()],
    playedAt: new Date('2026-05-25T12:00:00'),
    ...overrides,
  };
}

describe('badges - sessions count', () => {
  it('awards sessions_1 on first session', () => {
    const newly = evaluateBadges(mkCtx());
    expect(newly).toContain('sessions_1');
  });

  it('awards sessions_10 at exactly 10', () => {
    const sessions = Array.from({ length: 10 }, () => mkSession());
    const newly = evaluateBadges(
      mkCtx({ allSessions: sessions, session: sessions[9] })
    );
    expect(newly).toContain('sessions_10');
  });

  it('does not award sessions_10 with 9 sessions', () => {
    const sessions = Array.from({ length: 9 }, () => mkSession());
    const newly = evaluateBadges(mkCtx({ allSessions: sessions }));
    expect(newly).not.toContain('sessions_10');
  });

  it('does not re-award already-earned badges', () => {
    const newly = evaluateBadges(
      mkCtx({ user: mkUser({ earnedBadges: ['sessions_1'] }) })
    );
    expect(newly).not.toContain('sessions_1');
  });
});

describe('badges - perfect', () => {
  it('awards perfect_first on 100/100', () => {
    const s = mkSession({ correctCount: 100 });
    const newly = evaluateBadges(mkCtx({ session: s, allSessions: [s] }));
    expect(newly).toContain('perfect_first');
  });

  it('does not award perfect_first on 99/100', () => {
    const newly = evaluateBadges(mkCtx());
    expect(newly).not.toContain('perfect_first');
  });

  it('awards perfect_streak_3 on 3 consecutive perfects', () => {
    const perfects = Array.from({ length: 3 }, () =>
      mkSession({ correctCount: 100 })
    );
    const newly = evaluateBadges(
      mkCtx({ session: perfects[2], allSessions: perfects })
    );
    expect(newly).toContain('perfect_streak_3');
  });

  it('does not award perfect_streak_3 if last was not perfect', () => {
    const sessions = [
      mkSession({ correctCount: 100 }),
      mkSession({ correctCount: 100 }),
      mkSession({ correctCount: 99 }),
    ];
    const newly = evaluateBadges(
      mkCtx({ session: sessions[2], allSessions: sessions })
    );
    expect(newly).not.toContain('perfect_streak_3');
  });
});

describe('badges - speed', () => {
  it('awards speed_3min for perfect under 3min', () => {
    const s = mkSession({ correctCount: 100, durationMs: 2 * 60_000 });
    const newly = evaluateBadges(mkCtx({ session: s, allSessions: [s] }));
    expect(newly).toContain('speed_3min');
    expect(newly).toContain('speed_5min');
  });

  it('does not award speed_30sec for slower runs', () => {
    const s = mkSession({ correctCount: 100, durationMs: 31_000 });
    const newly = evaluateBadges(mkCtx({ session: s, allSessions: [s] }));
    expect(newly).not.toContain('speed_30sec');
    expect(newly).toContain('speed_60sec');
  });

  it('does not award speed badges if not perfect', () => {
    const s = mkSession({ correctCount: 99, durationMs: 30_000 });
    const newly = evaluateBadges(mkCtx({ session: s, allSessions: [s] }));
    expect(newly).not.toContain('speed_30sec');
  });
});

describe('badges - streak', () => {
  it('awards streak_7 when currentStreakDays is 7', () => {
    const newly = evaluateBadges(
      mkCtx({ user: mkUser({ currentStreakDays: 7 }) })
    );
    expect(newly).toContain('streak_7');
    expect(newly).toContain('streak_3');
  });

  it('does not award streak_7 at 6 days', () => {
    const newly = evaluateBadges(
      mkCtx({ user: mkUser({ currentStreakDays: 6 }) })
    );
    expect(newly).not.toContain('streak_7');
  });
});

describe('badges - master', () => {
  it('awards master_add_basic when Lv1 and Lv2 cleared perfectly', () => {
    const sessions = [
      mkSession({ level: 1, correctCount: 100 }),
      mkSession({ level: 2, correctCount: 100 }),
    ];
    const newly = evaluateBadges(
      mkCtx({ session: sessions[1], allSessions: sessions })
    );
    expect(newly).toContain('master_add_basic');
  });

  it('master_mul_basic requires Level 5 perfect clear', () => {
    const s = mkSession({ level: 5, correctCount: 100, operation: 'mul' });
    const newly = evaluateBadges(mkCtx({ session: s, allSessions: [s] }));
    expect(newly).toContain('master_mul_basic');
  });
});

describe('badges - timing', () => {
  it('awards early_bird if played at 7am', () => {
    const newly = evaluateBadges(
      mkCtx({ playedAt: new Date('2026-05-25T07:30:00') })
    );
    expect(newly).toContain('early_bird');
  });

  it('does not award early_bird at noon', () => {
    const newly = evaluateBadges(
      mkCtx({ playedAt: new Date('2026-05-25T12:00:00') })
    );
    expect(newly).not.toContain('early_bird');
  });

  it('night_owl at 21:00', () => {
    const newly = evaluateBadges(
      mkCtx({ playedAt: new Date('2026-05-25T21:00:00') })
    );
    expect(newly).toContain('night_owl');
  });

  it('late_night at 1am', () => {
    const newly = evaluateBadges(
      mkCtx({ playedAt: new Date('2026-05-25T01:00:00') })
    );
    expect(newly).toContain('late_night');
  });
});

describe('badges - special', () => {
  it('awards mix_master on perfect mix', () => {
    const s = mkSession({ level: 'mix', correctCount: 100 });
    const newly = evaluateBadges(mkCtx({ session: s, allSessions: [s] }));
    expect(newly).toContain('mix_master');
  });

  it('awards new_year_play on Jan 1', () => {
    const newly = evaluateBadges(
      mkCtx({ playedAt: new Date('2026-01-01T10:00:00') })
    );
    expect(newly).toContain('new_year_play');
  });

  it('awards birthday_play matching MM-DD', () => {
    const newly = evaluateBadges(
      mkCtx({
        playedAt: new Date('2026-03-15T10:00:00'),
        birthdayMMDD: '03-15',
      })
    );
    expect(newly).toContain('birthday_play');
  });

  it('awards comeback after 7+ day gap', () => {
    const prev = mkSession({ completedAt: 1000 });
    const now = mkSession({
      completedAt: 1000 + 8 * 24 * 60 * 60 * 1000,
    });
    const newly = evaluateBadges(
      mkCtx({ session: now, allSessions: [prev, now] })
    );
    expect(newly).toContain('comeback');
  });
});

describe('badges - meta', () => {
  it('badge_collector_25 with 25 badges', () => {
    const badges = Array.from({ length: 25 }, (_, i) => `badge_${i}`);
    const newly = evaluateBadges(
      mkCtx({ user: mkUser({ earnedBadges: badges }) })
    );
    expect(newly).toContain('badge_collector_25');
  });

  it('badge_collector_all when all but it earned', () => {
    const allButMeta = BADGE_CATALOG.filter(
      (b) => b.id !== 'badge_collector_all'
    ).map((b) => b.id);
    const newly = evaluateBadges(
      mkCtx({ user: mkUser({ earnedBadges: allButMeta }) })
    );
    expect(newly).toContain('badge_collector_all');
  });
});

describe('calculateStreakDays', () => {
  it('returns 0 with no sessions today', () => {
    expect(calculateStreakDays([], new Date('2026-05-25T12:00:00'))).toBe(0);
  });

  it('returns 1 when only today played', () => {
    const sessions = [
      mkSession({ completedAt: new Date('2026-05-25T10:00:00').getTime() }),
    ];
    expect(
      calculateStreakDays(sessions, new Date('2026-05-25T12:00:00'))
    ).toBe(1);
  });

  it('returns 3 for 3 consecutive days', () => {
    const sessions = [
      mkSession({ completedAt: new Date('2026-05-23T10:00:00').getTime() }),
      mkSession({ completedAt: new Date('2026-05-24T10:00:00').getTime() }),
      mkSession({ completedAt: new Date('2026-05-25T10:00:00').getTime() }),
    ];
    expect(
      calculateStreakDays(sessions, new Date('2026-05-25T12:00:00'))
    ).toBe(3);
  });

  it('breaks streak on gap', () => {
    const sessions = [
      mkSession({ completedAt: new Date('2026-05-23T10:00:00').getTime() }),
      mkSession({ completedAt: new Date('2026-05-25T10:00:00').getTime() }),
    ];
    expect(
      calculateStreakDays(sessions, new Date('2026-05-25T12:00:00'))
    ).toBe(1);
  });
});

describe('calculatePoints', () => {
  it('basic calculation', () => {
    const s = mkSession({ correctCount: 100, level: 1, durationMs: 60_000 });
    const pts = calculatePoints(s);
    // 100 * (1 + 0.5) = 150, +50 (3min) +30 (perfect) = 230
    expect(pts).toBe(230);
  });

  it('daily bonus +50', () => {
    const s = mkSession({
      correctCount: 100,
      level: 1,
      durationMs: 60_000,
      isDaily: true,
    });
    expect(calculatePoints(s)).toBe(280);
  });

  it('no perfect bonus on miss', () => {
    const s = mkSession({ correctCount: 90, level: 1, durationMs: 60_000 });
    // 90 * 1.5 = 135, +50 = 185 (no perfect, no daily)
    expect(calculatePoints(s)).toBe(185);
  });
});
