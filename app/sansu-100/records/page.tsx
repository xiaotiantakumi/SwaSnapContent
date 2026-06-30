'use client';

import React, { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import Header from '../../components/header';
import ThemeToggle from '../../components/theme-toggle';
import { formatDuration } from '../components/SessionTimer';
import { useSansuUser } from '../hooks/useSansuUser';
import { LEVELS } from '../lib/levels';

function timeRank(ms: number): { label: string; cls: string } {
  if (ms <= 90_000)
    return {
      label: '🥇',
      cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
    };
  if (ms <= 180_000)
    return {
      label: '🥈',
      cls: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
    };
  return {
    label: '🥉',
    cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  };
}

export default function RecordsPage(): React.JSX.Element {
  const router = useRouter();
  const { currentUser, loaded } = useSansuUser();

  useEffect(() => {
    if (!loaded) return;
    if (!currentUser) router.replace('/sansu-100');
  }, [loaded, currentUser, router]);

  if (!loaded || !currentUser) return <main className="p-8" />;

  const best = currentUser.bestTimesByLevel ?? {};
  const recordCount = Object.values(best).filter((v) => v > 0).length;

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
        <Header
          title="🏆 ベスト記録"
          description={`${recordCount} / ${LEVELS.length} レベルに記録あり`}
          showBackButton
          backHref="/sansu-100"
          backLabel="ホームにもどる"
        />

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          {[
            { label: '🥇 90秒以内', cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200' },
            { label: '🥈 3分以内', cls: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200' },
            { label: '🥉 3分以上', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
          ].map(({ label, cls }) => (
            <span key={label} className={`rounded-full px-2 py-0.5 font-semibold ${cls}`}>
              {label}
            </span>
          ))}
        </div>

        <section className="overflow-hidden rounded-2xl bg-white shadow-md dark:bg-gray-800">
          <table className="w-full text-sm" data-testid="records-table">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50">
                <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">
                  レベル
                </th>
                <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-200">
                  ないよう
                </th>
                <th className="px-4 py-3 text-right font-bold text-gray-700 dark:text-gray-200">
                  ベストタイム
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {LEVELS.map((lv) => {
                const key = `lv${lv.id}:${lv.operation}`;
                const ms = best[key];
                const hasRecord = typeof ms === 'number' && ms > 0;
                const rank = hasRecord ? timeRank(ms) : null;

                return (
                  <tr
                    key={lv.id}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    data-testid={`record-row-${lv.id}`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        {lv.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {lv.description}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {hasRecord && rank ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold ${rank.cls}`}
                          data-testid={`best-time-${lv.id}`}
                        >
                          {rank.label} {formatDuration(ms)}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">
                          --
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          れんしゅうしてベストタイムを 更新しよう！
        </p>
      </div>
    </main>
  );
}
