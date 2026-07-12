'use client';

import React, { useMemo } from 'react';

import { storage } from '../lib/storage';
import type { SansuUserPublic } from '../lib/types';

// ストリークバッジの閾値（昇順）。
const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

function todayJst(): string {
  // JST (UTC+9) で今日の YYYY-MM-DD を返す。
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function dateString(offsetDays: number): string {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000 - offsetDays * 86400000);
  return d.toISOString().slice(0, 10);
}

function dayLabel(date: string): string {
  // YYYY-MM-DD → "M/D"
  const [, m, d] = date.split('-');
  return `${parseInt(m)}/${parseInt(d)}`;
}

interface Props {
  user: SansuUserPublic;
}

export default function StreakCard({ user }: Props): React.JSX.Element | null {
  const today = todayJst();

  // 過去7日間の練習済み日付セット（セッション履歴から集計）。
  const practicedDates = useMemo(() => {
    const sessions = storage.getSessions(user.id);
    const set = new Set<string>();
    const cutoff = dateString(6); // 7日前
    for (const s of sessions) {
      if (!s.completedAt) continue;
      const d = new Date(s.completedAt + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
      if (d >= cutoff) set.add(d);
    }
    return set;
  }, [user.id]);

  const streak = user.currentStreakDays ?? 0;
  const practicedToday = practicedDates.has(today) || user.lastPlayedDate === today;

  // 次のバッジ閾値を計算。
  const nextMilestone = STREAK_MILESTONES.find((m) => m > streak);
  const daysToNext = nextMilestone != null ? nextMilestone - streak : null;

  // 過去7日間カレンダー（今日=index0）。
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = dateString(i);
    const practiced = practicedDates.has(date) || (i === 0 && user.lastPlayedDate === today);
    return { date, practiced, isToday: i === 0 };
  });

  return (
    <div
      className="rounded-2xl bg-orange-50 p-4 shadow-sm dark:bg-orange-900/20"
      data-testid="streak-card"
    >
      {/* ストリーク表示 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{streak > 0 ? '🔥' : '💤'}</span>
          <div>
            <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
              {streak > 0 ? `${streak}にち れんぞく！` : 'きょうから はじめよう！'}
            </p>
            {daysToNext != null ? (
              <p className="text-xs text-orange-500 dark:text-orange-400">
                つぎのバッジまで あと {daysToNext}にち
              </p>
            ) : streak >= 100 ? (
              <p className="text-xs text-orange-500 dark:text-orange-400">
                🌈 でんせつの れんぞく！
              </p>
            ) : null}
          </div>
        </div>
        {practicedToday ? (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-300">
            きょう OK ✓
          </span>
        ) : (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            きょうは まだ
          </span>
        )}
      </div>

      {/* 週間カレンダー（右が今日） */}
      <div className="flex justify-between gap-1" aria-label="れんしゅうカレンダー">
        {days.slice().reverse().map(({ date, practiced, isToday }) => (
          <div key={date} className="flex flex-1 flex-col items-center gap-0.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {dayLabel(date)}
            </span>
            <span
              className="text-base"
              title={practiced ? 'れんしゅうした' : isToday ? 'きょう' : 'おやすみ'}
            >
              {practiced ? '🟢' : isToday ? '🔵' : '⬜'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
