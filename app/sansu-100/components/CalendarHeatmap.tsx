'use client';

import React from 'react';

import type { SansuSession } from '../lib/types';

interface Props {
  sessions: SansuSession[];
}

const JST_OFFSET = 9 * 60 * 60 * 1000;

function toJSTDate(ts: number): Date {
  return new Date(ts + JST_OFFSET);
}

function jstYMD(ts: number): string {
  const d = toJSTDate(ts);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function countColor(count: number): string {
  if (count === 0) return 'bg-gray-100 dark:bg-gray-700';
  if (count === 1) return 'bg-blue-200 dark:bg-blue-800';
  if (count <= 3) return 'bg-blue-400 dark:bg-blue-600';
  return 'bg-blue-600 dark:bg-blue-400';
}

export default function CalendarHeatmap({ sessions }: Props): React.JSX.Element {
  const now = Date.now();
  const jstNow = toJSTDate(now);
  const year = jstNow.getUTCFullYear();
  const month = jstNow.getUTCMonth(); // 0-indexed

  const monthLabel = `${year}年${month + 1}月`;

  // Build count map for this month: "YYYY-MM-DD" -> count
  const countMap = new Map<string, number>();
  for (const s of sessions) {
    const d = toJSTDate(s.completedAt);
    if (d.getUTCFullYear() === year && d.getUTCMonth() === month) {
      const key = jstYMD(s.completedAt);
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }
  }

  // Days in this month
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  // Day of week for 1st of month (0=Sun)
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();

  // Today key
  const todayKey = jstYMD(now);

  // Stats
  const practiceDays = countMap.size;
  const totalSessions = Array.from(countMap.values()).reduce((a, b) => a + b, 0);

  // Build grid cells: leading empty + day cells
  const cells: Array<{ day: number | null }> = [
    ...Array.from({ length: firstDow }, () => ({ day: null })),
    ...Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1 })),
  ];

  return (
    <div className="space-y-3" data-testid="calendar-heatmap">
      <div className="flex items-baseline justify-between">
        <h3 className="font-bold text-gray-900 dark:text-gray-100">{monthLabel}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {practiceDays}日 / {totalSessions}回
        </p>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400 dark:text-gray-500">
        {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (cell.day === null) {
            return <div key={`empty-${String(i)}`} />;
          }
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
          const count = countMap.get(key) ?? 0;
          const isToday = key === todayKey;

          return (
            <div
              key={key}
              className={`flex aspect-square items-center justify-center rounded-md text-xs font-medium ${countColor(count)} ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
              title={count > 0 ? `${cell.day}日: ${count}回` : `${cell.day}日`}
              data-testid={`cal-day-${cell.day}`}
            >
              <span className={count > 0 ? 'text-blue-900 dark:text-blue-100' : 'text-gray-500 dark:text-gray-400'}>
                {cell.day}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <span>少</span>
        <div className="flex gap-1">
          {[0, 1, 2, 4].map((n) => (
            <div key={n} className={`size-3 rounded-sm ${countColor(n)}`} />
          ))}
        </div>
        <span>多</span>
      </div>
    </div>
  );
}
