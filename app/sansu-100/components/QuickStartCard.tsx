'use client';

import React from 'react';

import Link from 'next/link';

import { LEVELS } from '../lib/levels';
import type { SansuSession } from '../lib/types';

interface Props {
  sessions: SansuSession[];
}

export default function QuickStartCard({ sessions }: Props): React.JSX.Element | null {
  if (sessions.length === 0) return null;

  const last = [...sessions].sort((a, b) => b.completedAt - a.completedAt)[0];
  if (last.level === 'mix') return null;

  const levelDef = LEVELS.find((l) => l.id === last.level);
  if (!levelDef) return null;

  const href = `/sansu-100/play?level=${last.level}&op=${last.operation}`;

  return (
    <div
      className="flex items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3 dark:bg-indigo-900/20"
      data-testid="quick-start-card"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs text-indigo-600 dark:text-indigo-400">
          まえにやったれんしゅう
        </p>
        <p className="truncate font-bold text-indigo-900 dark:text-indigo-100">
          {levelDef.label}
        </p>
        <p className="text-xs text-indigo-700 dark:text-indigo-300">
          {levelDef.description}
        </p>
      </div>
      <Link
        href={href}
        className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-700"
        data-testid="quick-start-btn"
      >
        すぐスタート
      </Link>
    </div>
  );
}
