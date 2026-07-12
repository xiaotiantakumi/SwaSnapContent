'use client';

import React, { useMemo } from 'react';

import Link from 'next/link';

import { dailyLevel, todayKey } from '../lib/daily';
import { LEVELS } from '../lib/levels';
import { storage } from '../lib/storage';
import type { SansuUserPublic } from '../lib/types';

const OP_EMOJI: Record<string, string> = {
  add: '➕',
  sub: '➖',
  mul: '✖️',
  div: '➗',
};

interface Props {
  user: SansuUserPublic;
}

export default function DailyChallengeCard({ user }: Props): React.JSX.Element {
  const today = todayKey();
  const levelId = dailyLevel();
  const levelDef = LEVELS.find((l) => l.id === levelId);

  // 今日の isDaily セッションが存在するか確認
  const completed = useMemo(() => {
    const sessions = storage.getSessions(user.id);
    return sessions.some((s) => {
      if (!s.isDaily || !s.completedAt) return false;
      const d = new Date(s.completedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return key === today;
    });
  }, [user.id, today]);

  const emoji = levelDef ? OP_EMOJI[levelDef.operation] ?? '🧮' : '🧮';
  const label = levelDef?.label ?? `Lv.${levelId}`;
  const desc = levelDef?.description ?? '';

  return (
    <div
      className={`rounded-2xl p-4 shadow-sm ${completed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}
      data-testid="daily-challenge-card"
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="text-3xl">{completed ? '✅' : '⭐'}</span>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-500 dark:text-blue-400">
            きょうのチャレンジ
          </p>
          <p className="font-bold text-gray-900 dark:text-gray-100">
            {emoji} {label}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
        </div>
        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
          +50pt
        </span>
      </div>

      {completed ? (
        <p className="text-center text-sm font-bold text-green-700 dark:text-green-300">
          🎉 きょうは クリア済み！また あした！
        </p>
      ) : (
        <Link
          href="/sansu-100/play?daily=1"
          className="block w-full rounded-xl bg-blue-500 py-3 text-center font-bold text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          data-testid="daily-challenge-btn"
        >
          チャレンジする！
        </Link>
      )}
    </div>
  );
}
