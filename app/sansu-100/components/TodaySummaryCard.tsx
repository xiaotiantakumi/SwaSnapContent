'use client';

import React from 'react';

import Link from 'next/link';

import type { SansuSession } from '../lib/types';

interface Props {
  sessions: SansuSession[];
}

const JST_OFFSET = 9 * 60 * 60 * 1000;

function jstDateKey(ts: number): string {
  const d = new Date(ts + JST_OFFSET);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export default function TodaySummaryCard({ sessions }: Props): React.JSX.Element {
  const todayKey = jstDateKey(Date.now());

  const todaySessions = sessions.filter(
    (s) => !s.isRetired && jstDateKey(s.completedAt) === todayKey
  );

  const count = todaySessions.length;
  const coinsToday = todaySessions.reduce((sum, s) => sum + (s.pointsEarned ?? 0), 0);
  const perfectToday = todaySessions.filter(
    (s) => s.correctCount === s.totalProblems
  ).length;

  if (count === 0) {
    return (
      <div
        className="rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 p-5 text-center dark:border-blue-700 dark:bg-blue-900/20"
        data-testid="today-summary-card"
      >
        <p className="mb-3 text-base font-semibold text-blue-700 dark:text-blue-300">
          今日は まだ れんしゅうしていないよ。
          <br />
          さあ はじめよう！
        </p>
        <Link
          href="/sansu-100/play"
          className="inline-block rounded-xl bg-blue-600 px-6 py-2 font-bold text-white hover:bg-blue-700"
          data-testid="today-play-btn"
        >
          ▶ れんしゅうする
        </Link>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-5 dark:from-blue-900/20 dark:to-indigo-900/20"
      data-testid="today-summary-card"
    >
      <p className="mb-3 text-sm font-bold text-blue-700 dark:text-blue-300">
        🌟 今日のれんしゅう
      </p>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-gray-800">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">
            {count}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">かい</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-gray-800">
          <p className="text-2xl font-bold text-yellow-500 dark:text-yellow-300">
            {coinsToday}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">🪙 pt</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-gray-800">
          <p className="text-2xl font-bold text-green-500 dark:text-green-300">
            {perfectToday}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">💯 かん点</p>
        </div>
      </div>
    </div>
  );
}
