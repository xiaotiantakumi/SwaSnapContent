'use client';

import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import Header from '../../components/header';
import ThemeToggle from '../../components/theme-toggle';
import BadgeShowcase from '../components/BadgeShowcase';
import { formatDuration } from '../components/SessionTimer';
import StatsCharts from '../components/StatsCharts';
import { useSansuUser } from '../hooks/useSansuUser';
import { storage } from '../lib/storage';
import type { LevelId, Operation, SansuSession } from '../lib/types';

const OP_LABELS: Record<Operation, string> = {
  add: 'たし算',
  sub: 'ひき算',
  mul: 'かけ算',
  div: 'わり算',
  mixed: 'ミックス',
};

const LEVEL_ORDER: Array<LevelId> = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 'mix'];
const OP_ORDER: Array<Operation> = ['add', 'sub', 'mul', 'div', 'mixed'];

type BestEntry = { level: LevelId; operation: Operation; ms: number };

function parseBestTimes(bestTimesByLevel: Record<string, number>): BestEntry[] {
  const entries: BestEntry[] = [];
  for (const [key, ms] of Object.entries(bestTimesByLevel)) {
    const raw = key.replace(/^lv/, '');
    const colonIdx = raw.indexOf(':');
    if (colonIdx === -1) continue;
    const lvStr = raw.slice(0, colonIdx);
    const op = raw.slice(colonIdx + 1) as Operation;
    const level = lvStr === 'mix' ? ('mix' as LevelId) : (Number(lvStr) as LevelId);
    if (ms > 0) entries.push({ level, operation: op, ms });
  }
  entries.sort((a, b) => {
    const li = LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level);
    if (li !== 0) return li;
    return OP_ORDER.indexOf(a.operation) - OP_ORDER.indexOf(b.operation);
  });
  return entries;
}

export default function HistoryPage(): React.JSX.Element {
  const router = useRouter();
  const { currentUser, loaded } = useSansuUser();
  const [sessions, setSessions] = useState<SansuSession[]>([]);

  useEffect(() => {
    if (!loaded) return;
    if (!currentUser) {
      router.replace('/sansu-100');
      return;
    }
    setSessions(storage.getSessions(currentUser.id));
  }, [loaded, currentUser, router]);

  if (!loaded || !currentUser) return <main className="p-8" />;

  const latest = sessions.slice(-10).reverse();
  const bestEntries = parseBestTimes(currentUser.bestTimesByLevel ?? {});

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
        <Header
          title={`${currentUser.name} のきろく`}
          description={`累計 ${currentUser.totalSessions}回 / ${currentUser.totalPoints}pt`}
          showBackButton
          backHref="/sansu-100"
          backLabel="ホームにもどる"
        />

        <section className="space-y-3 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            📊 グラフ
          </h2>
          <StatsCharts sessions={sessions} />
        </section>

        <section className="space-y-3 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            🕒 さいきんの れんしゅう
          </h2>
          {latest.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              まだ きろくが ないよ
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {latest.map((s) => (
                <li
                  key={s.id}
                  className={`flex items-center justify-between py-2 ${s.isRetired ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(s.completedAt).toLocaleString('ja-JP', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        Lv.{s.level} {s.operation}
                      </span>
                      {s.isRetired ? (
                        <span className="ml-1 rounded bg-gray-200 px-1 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          ⏸ 途中
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      {s.isRetired
                        ? `${s.totalProblems}問`
                        : formatDuration(s.durationMs)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {s.correctCount}/{s.totalProblems} ・ +
                      {s.pointsEarned}pt
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {bestEntries.length > 0 ? (
          <section
            className="space-y-3 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800"
            data-testid="best-times-section"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              🏆 レベル別ベスト
            </h2>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {bestEntries.map((e) => (
                <li
                  key={`lv${e.level}:${e.operation}`}
                  className="flex items-center justify-between py-2"
                  data-testid={`best-row-lv${e.level}-${e.operation}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      Lv.{e.level}
                    </span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {OP_LABELS[e.operation] ?? e.operation}
                    </span>
                  </div>
                  <span className="font-bold tabular-nums text-gray-900 dark:text-gray-100">
                    ⏱ {formatDuration(e.ms)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
          <BadgeShowcase earned={currentUser.earnedBadges} />
        </section>
      </div>
    </main>
  );
}
