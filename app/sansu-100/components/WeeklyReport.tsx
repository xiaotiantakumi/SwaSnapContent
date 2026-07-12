'use client';

import React, { useMemo } from 'react';

import type { SansuSession } from '../lib/types';

import { formatDuration } from './SessionTimer';

interface WeeklyReportProps {
  sessions: SansuSession[];
}

const DOW_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

/** JST オフセット込みで Date オブジェクトを返す */
function nowJST(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

/** JST の今週月曜 00:00 の UTC タイムスタンプ */
function thisWeekMondayUTC(): number {
  const jst = nowJST();
  const dow = jst.getUTCDay(); // 0=Sun,1=Mon,...,6=Sat
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  const mondayJST = new Date(jst);
  mondayJST.setUTCHours(0, 0, 0, 0);
  mondayJST.setUTCDate(mondayJST.getUTCDate() - daysFromMon);
  // JST midnight → UTC: subtract 9h
  return mondayJST.getTime() - 9 * 60 * 60 * 1000;
}

/** YYYY-MM-DD (JST) */
function toJSTDateKey(ts: number): string {
  const d = new Date(ts + 9 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** 月曜始まり 0-indexed の曜日 (0=Mon … 6=Sun) */
function dowIndexJST(ts: number): number {
  const d = new Date(ts + 9 * 60 * 60 * 1000);
  const dow = d.getUTCDay(); // 0=Sun
  return dow === 0 ? 6 : dow - 1;
}

export default function WeeklyReport({
  sessions,
}: WeeklyReportProps): React.JSX.Element {
  const stats = useMemo(() => {
    const mondayUTC = thisWeekMondayUTC();
    const thisWeek = sessions.filter(
      (s) => s.completedAt >= mondayUTC && !s.isRetired
    );

    const totalMs = thisWeek.reduce((s, r) => s + r.durationMs, 0);
    const count = thisWeek.length;

    const perfectMs = thisWeek
      .filter((s) => s.correctCount === s.totalProblems)
      .map((s) => s.durationMs);
    const bestMs = perfectMs.length > 0 ? Math.min(...perfectMs) : null;

    // 練習した曜日セット（月曜起点0〜6）
    const practicedDays = new Set(thisWeek.map((s) => dowIndexJST(s.completedAt)));

    // 今日の曜日インデックス
    const todayIdx = dowIndexJST(Date.now());

    return { count, totalMs, bestMs, practicedDays, todayIdx };
  }, [sessions]);

  return (
    <div className="space-y-4" data-testid="weekly-report">
      {/* 曜日インジケータ */}
      <div className="flex justify-between">
        {DOW_LABELS.map((label, i) => {
          const practiced = stats.practicedDays.has(i);
          const isToday = i === stats.todayIdx;
          return (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className={`flex size-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                  practiced
                    ? 'bg-blue-500 text-white shadow-md'
                    : isToday
                      ? 'border-2 border-blue-400 text-blue-600 dark:text-blue-300'
                      : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                }`}
                data-testid={`dow-${label}`}
              >
                {practiced ? '✓' : label}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
            </div>
          );
        })}
      </div>

      {/* 数値サマリー */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center rounded-xl bg-blue-50 p-3 text-center dark:bg-blue-900/20">
          <span className="text-lg">🏃</span>
          <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
            {stats.count}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">今週の回数</p>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-green-50 p-3 text-center dark:bg-green-900/20">
          <span className="text-lg">⏱️</span>
          <p className="text-xl font-bold text-green-700 dark:text-green-300">
            {stats.totalMs > 0 ? formatDuration(stats.totalMs) : '-'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">累計時間</p>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-yellow-50 p-3 text-center dark:bg-yellow-900/20">
          <span className="text-lg">⚡</span>
          <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300">
            {stats.bestMs != null ? formatDuration(stats.bestMs) : '-'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">今週のベスト</p>
        </div>
      </div>

      {stats.count === 0 ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          今週はまだ れんしゅうしていないよ。さあ はじめよう！
        </p>
      ) : null}
    </div>
  );
}
