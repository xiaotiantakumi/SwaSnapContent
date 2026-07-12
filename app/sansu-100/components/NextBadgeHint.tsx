'use client';

import React from 'react';

import { BADGE_CATALOG } from '../lib/badge-catalog';
import type { SansuUserPublic } from '../lib/types';

interface Props {
  user: SansuUserPublic;
}

type BadgeProgress = {
  badgeId: string;
  badgeName: string;
  badgeIcon: string;
  remaining: number;
  unit: string;
};

// sessions_* バッジのしきい値
const SESSION_THRESHOLDS: { badgeId: string; threshold: number }[] = [
  { badgeId: 'sessions_1', threshold: 1 },
  { badgeId: 'sessions_5', threshold: 5 },
  { badgeId: 'sessions_10', threshold: 10 },
  { badgeId: 'sessions_30', threshold: 30 },
  { badgeId: 'sessions_50', threshold: 50 },
  { badgeId: 'sessions_100', threshold: 100 },
  { badgeId: 'sessions_200', threshold: 200 },
  { badgeId: 'sessions_500', threshold: 500 },
  { badgeId: 'sessions_1000', threshold: 1000 },
];

// streak_* バッジのしきい値
const STREAK_THRESHOLDS: { badgeId: string; threshold: number }[] = [
  { badgeId: 'streak_3', threshold: 3 },
  { badgeId: 'streak_7', threshold: 7 },
  { badgeId: 'streak_14', threshold: 14 },
  { badgeId: 'streak_30', threshold: 30 },
  { badgeId: 'streak_60', threshold: 60 },
  { badgeId: 'streak_100', threshold: 100 },
];

export default function NextBadgeHint({ user }: Props): React.JSX.Element | null {
  const earned = new Set(user.earnedBadges);
  const catalog = new Map(BADGE_CATALOG.map((b) => [b.id, b]));

  const candidates: BadgeProgress[] = [];

  for (const { badgeId, threshold } of SESSION_THRESHOLDS) {
    if (earned.has(badgeId)) continue;
    const remaining = threshold - (user.totalSessions ?? 0);
    if (remaining <= 0) continue;
    const def = catalog.get(badgeId);
    if (!def) continue;
    candidates.push({
      badgeId,
      badgeName: def.name,
      badgeIcon: def.icon,
      remaining,
      unit: 'かい',
    });
    break; // 最も近い1件だけ
  }

  for (const { badgeId, threshold } of STREAK_THRESHOLDS) {
    if (earned.has(badgeId)) continue;
    const remaining = threshold - (user.currentStreakDays ?? 0);
    if (remaining <= 0) continue;
    const def = catalog.get(badgeId);
    if (!def) continue;
    candidates.push({
      badgeId,
      badgeName: def.name,
      badgeIcon: def.icon,
      remaining,
      unit: '日',
    });
    break;
  }

  if (candidates.length === 0) return null;

  // 残数が最も少ないものを選ぶ
  const best = candidates.reduce((a, b) => (a.remaining <= b.remaining ? a : b));

  return (
    <div
      className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 dark:bg-amber-900/20"
      data-testid="next-badge-hint"
    >
      <span className="text-2xl" aria-hidden>
        {best.badgeIcon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-amber-700 dark:text-amber-300">
          もうすぐ バッジゲット！
        </p>
        <p className="truncate text-sm font-bold text-amber-900 dark:text-amber-100">
          あと{' '}
          <span className="text-base text-blue-600 dark:text-blue-300">
            {best.remaining}
          </span>
          {best.unit} で{' '}
          <span className="font-bold">{best.badgeName}</span>
        </p>
      </div>
    </div>
  );
}
