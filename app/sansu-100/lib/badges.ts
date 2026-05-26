import { BADGE_CATALOG } from './badge-catalog';
import type { SansuSession, SansuUserPublic } from './types';

export type BadgeEvalContext = {
  user: SansuUserPublic;
  session: SansuSession;
  /** All past sessions including the just-completed one (newest last) */
  allSessions: SansuSession[];
  /** Date in user's local timezone */
  playedAt: Date;
  /** YYYY-MM-DD of birthday if known (MM-DD comparison) */
  birthdayMMDD?: string;
};

type Rule = (ctx: BadgeEvalContext) => boolean;

const LEVELS_ADD = [1, 2, 7, 8];
const LEVELS_SUB = [3, 4, 9];
const LEVELS_MUL = [5, 10];
const LEVELS_DIV = [6, 11];

function levelsCleared(
  sessions: SansuSession[],
  levels: number[]
): Set<number> {
  const cleared = new Set<number>();
  for (const s of sessions) {
    if (
      typeof s.level === 'number' &&
      levels.includes(s.level) &&
      s.correctCount === s.totalProblems
    ) {
      cleared.add(s.level);
    }
  }
  return cleared;
}

function isPerfect(s: SansuSession): boolean {
  return s.correctCount === s.totalProblems;
}

function consecutivePerfectTail(sessions: SansuSession[], n: number): boolean {
  if (sessions.length < n) return false;
  return sessions.slice(-n).every(isPerfect);
}

function dateToMMDD(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}-${dd}`;
}

function dateToYMD(date: Date): string {
  return `${date.getFullYear()}-${dateToMMDD(date)}`;
}

function uniqueDatesInLast(sessions: SansuSession[], days: number): Set<string> {
  const set = new Set<string>();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  for (const s of sessions) {
    if (s.completedAt >= cutoff) {
      set.add(dateToYMD(new Date(s.completedAt)));
    }
  }
  return set;
}

const RULES: Record<string, Rule> = {
  sessions_1: ({ allSessions }) => allSessions.length >= 1,
  sessions_5: ({ allSessions }) => allSessions.length >= 5,
  sessions_10: ({ allSessions }) => allSessions.length >= 10,
  sessions_30: ({ allSessions }) => allSessions.length >= 30,
  sessions_50: ({ allSessions }) => allSessions.length >= 50,
  sessions_100: ({ allSessions }) => allSessions.length >= 100,
  sessions_200: ({ allSessions }) => allSessions.length >= 200,
  sessions_500: ({ allSessions }) => allSessions.length >= 500,
  sessions_1000: ({ allSessions }) => allSessions.length >= 1000,

  perfect_first: ({ session }) => isPerfect(session),
  perfect_5: ({ allSessions }) => allSessions.filter(isPerfect).length >= 5,
  perfect_10: ({ allSessions }) => allSessions.filter(isPerfect).length >= 10,
  perfect_50: ({ allSessions }) => allSessions.filter(isPerfect).length >= 50,
  perfect_streak_3: ({ allSessions }) =>
    consecutivePerfectTail(allSessions, 3),

  speed_5min: ({ session }) =>
    isPerfect(session) && session.durationMs <= 5 * 60_000,
  speed_3min: ({ session }) =>
    isPerfect(session) && session.durationMs <= 3 * 60_000,
  speed_2min: ({ session }) =>
    isPerfect(session) && session.durationMs <= 2 * 60_000,
  speed_90sec: ({ session }) =>
    isPerfect(session) && session.durationMs <= 90_000,
  speed_60sec: ({ session }) =>
    isPerfect(session) && session.durationMs <= 60_000,
  speed_30sec: ({ session }) =>
    isPerfect(session) && session.durationMs <= 30_000,

  streak_3: ({ user }) => user.currentStreakDays >= 3,
  streak_7: ({ user }) => user.currentStreakDays >= 7,
  streak_14: ({ user }) => user.currentStreakDays >= 14,
  streak_30: ({ user }) => user.currentStreakDays >= 30,
  streak_60: ({ user }) => user.currentStreakDays >= 60,
  streak_100: ({ user }) => user.currentStreakDays >= 100,

  master_add_basic: ({ allSessions }) =>
    levelsCleared(allSessions, [1, 2]).size === 2,
  master_add_full: ({ allSessions }) =>
    levelsCleared(allSessions, LEVELS_ADD).size === LEVELS_ADD.length,
  master_sub_basic: ({ allSessions }) =>
    levelsCleared(allSessions, [3, 4]).size === 2,
  master_sub_full: ({ allSessions }) =>
    levelsCleared(allSessions, LEVELS_SUB).size === LEVELS_SUB.length,
  master_mul_basic: ({ allSessions }) =>
    levelsCleared(allSessions, [5]).size === 1,
  master_mul_full: ({ allSessions }) =>
    levelsCleared(allSessions, LEVELS_MUL).size === LEVELS_MUL.length,
  master_div_basic: ({ allSessions }) =>
    levelsCleared(allSessions, [6]).size === 1,
  master_div_full: ({ allSessions }) =>
    levelsCleared(allSessions, LEVELS_DIV).size === LEVELS_DIV.length,

  early_bird: ({ playedAt }) => {
    const h = playedAt.getHours();
    return h >= 6 && h < 9;
  },
  night_owl: ({ playedAt }) => {
    const h = playedAt.getHours();
    return h >= 20 && h < 22;
  },
  weekend_warrior: ({ allSessions }) => {
    const last14 = uniqueDatesInLast(allSessions, 14);
    let sawSat = false;
    let sawSun = false;
    for (const ymd of last14) {
      const d = new Date(ymd + 'T12:00:00');
      if (d.getDay() === 6) sawSat = true;
      if (d.getDay() === 0) sawSun = true;
    }
    return sawSat && sawSun;
  },

  daily_first: ({ session }) => session.isDaily,
  daily_7: ({ user, session }) => session.isDaily && user.currentStreakDays >= 7,
  daily_30: ({ user, session }) =>
    session.isDaily && user.currentStreakDays >= 30,
  daily_100: ({ user, session }) =>
    session.isDaily && user.currentStreakDays >= 100,

  comeback: ({ allSessions, session }) => {
    if (allSessions.length < 2) return false;
    const prev = allSessions[allSessions.length - 2];
    return session.completedAt - prev.completedAt >= 7 * 24 * 60 * 60 * 1000;
  },
  mix_master: ({ session }) => session.level === 'mix' && isPerfect(session),
  birthday_play: ({ playedAt, birthdayMMDD }) =>
    !!birthdayMMDD && dateToMMDD(playedAt) === birthdayMMDD,
  new_year_play: ({ playedAt }) => dateToMMDD(playedAt) === '01-01',
  late_night: ({ playedAt }) => {
    const h = playedAt.getHours();
    return h >= 0 && h < 3;
  },

  badge_collector_25: ({ user }) => user.earnedBadges.length >= 25,
  badge_collector_all: ({ user }) =>
    user.earnedBadges.length >= BADGE_CATALOG.length - 1,
};

export function evaluateBadges(ctx: BadgeEvalContext): string[] {
  const earned = new Set(ctx.user.earnedBadges);
  const newly: string[] = [];
  for (const def of BADGE_CATALOG) {
    if (earned.has(def.id)) continue;
    const rule = RULES[def.id];
    if (rule && rule(ctx)) {
      newly.push(def.id);
    }
  }
  return newly;
}

/**
 * Calculate streak days based on session history and today's session date.
 * Returns the number of consecutive days (including today) ending at the given date.
 */
export function calculateStreakDays(
  sessions: SansuSession[],
  asOfDate: Date
): number {
  const dates = new Set<string>();
  for (const s of sessions) {
    dates.add(dateToYMD(new Date(s.completedAt)));
  }
  let count = 0;
  const cursor = new Date(asOfDate);
  cursor.setHours(12, 0, 0, 0);
  while (dates.has(dateToYMD(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function calculatePoints(session: SansuSession): number {
  let pts = session.correctCount;
  const levelNum = typeof session.level === 'number' ? session.level : 6;
  pts = Math.round(pts * (1 + levelNum * 0.5));
  if (session.durationMs <= 3 * 60_000) pts += 50;
  else if (session.durationMs <= 5 * 60_000) pts += 20;
  if (session.correctCount === session.totalProblems) pts += 30;
  if (session.isDaily) pts += 50;
  return pts;
}
