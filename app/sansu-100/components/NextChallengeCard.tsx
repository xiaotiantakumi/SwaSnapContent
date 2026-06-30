'use client';

import React from 'react';

import Link from 'next/link';

import { LEVELS } from '../lib/levels';
import type { SansuSession } from '../lib/types';

interface Props {
  session: SansuSession;
  previousBest: number | null;
}

export default function NextChallengeCard({ session, previousBest }: Props): React.JSX.Element | null {
  if (session.level === 'mix') return null;

  const isPerfect = session.correctCount === session.totalProblems;
  const currentIdx = LEVELS.findIndex((l) => l.id === session.level);
  const nextLevel = currentIdx >= 0 && currentIdx < LEVELS.length - 1 ? LEVELS[currentIdx + 1] : null;

  // パーフェクト + ベスト更新 or 2分以内 → 次レベルへ
  const fastTime =
    session.durationMs <= 120000 ||
    (previousBest !== null && session.durationMs < previousBest);

  if (!isPerfect) {
    return (
      <div
        className="rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-900/20"
        data-testid="next-challenge-card"
      >
        <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
          💪 もう1かい れんしゅうしよう！
        </p>
        <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
          ぜんもん せいかいを めざそう！
        </p>
        <Link
          href={`/sansu-100/play?level=${session.level}&op=${session.operation}`}
          className="mt-2 inline-block rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-blue-700"
          data-testid="next-challenge-btn"
        >
          おなじ レベルに もう1かい
        </Link>
      </div>
    );
  }

  if (isPerfect && fastTime && nextLevel) {
    return (
      <div
        className="rounded-xl bg-green-50 px-4 py-3 dark:bg-green-900/20"
        data-testid="next-challenge-card"
      >
        <p className="text-sm font-bold text-green-800 dark:text-green-200">
          🚀 つぎのレベルに ちょうせんしよう！
        </p>
        <p className="mt-1 text-xs text-green-600 dark:text-green-400">
          {nextLevel.label}：{nextLevel.description}
        </p>
        <Link
          href={`/sansu-100/play?level=${nextLevel.id}&op=${nextLevel.operation}`}
          className="mt-2 inline-block rounded-lg bg-green-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-green-700"
          data-testid="next-challenge-btn"
        >
          {nextLevel.label} に ちょうせん！
        </Link>
      </div>
    );
  }

  if (isPerfect && !fastTime && nextLevel) {
    return (
      <div
        className="rounded-xl bg-yellow-50 px-4 py-3 dark:bg-yellow-900/20"
        data-testid="next-challenge-card"
      >
        <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
          ⏱️ タイムを ちぢめよう！
        </p>
        <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
          もっと はやく とけるかな？
        </p>
        <Link
          href={`/sansu-100/play?level=${session.level}&op=${session.operation}`}
          className="mt-2 inline-block rounded-lg bg-yellow-500 px-4 py-1.5 text-sm font-bold text-white hover:bg-yellow-600"
          data-testid="next-challenge-btn"
        >
          おなじ レベルで もっと はやく！
        </Link>
      </div>
    );
  }

  // 最終レベルでパーフェクト
  if (isPerfect && !nextLevel) {
    return (
      <div
        className="rounded-xl bg-purple-50 px-4 py-3 dark:bg-purple-900/20"
        data-testid="next-challenge-card"
      >
        <p className="text-sm font-bold text-purple-800 dark:text-purple-200">
          👑 すごい！ぜんレベル マスター！
        </p>
        <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
          タイムをさらにちぢめてみよう！
        </p>
        <Link
          href={`/sansu-100/play?level=${session.level}&op=${session.operation}`}
          className="mt-2 inline-block rounded-lg bg-purple-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-purple-700"
          data-testid="next-challenge-btn"
        >
          タイムアタック！
        </Link>
      </div>
    );
  }

  return null;
}
