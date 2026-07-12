'use client';

import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import Header from '../../components/header';
import ThemeToggle from '../../components/theme-toggle';
import BadgeShowcase from '../components/BadgeShowcase';
import { formatDuration } from '../components/SessionTimer';
import StatsCharts from '../components/StatsCharts';
import WeeklyReport from '../components/WeeklyReport';
import { useSansuUser } from '../hooks/useSansuUser';
import { storage } from '../lib/storage';
import type { SansuSession } from '../lib/types';

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
            📅 今週のれんしゅう
          </h2>
          <WeeklyReport sessions={sessions} />
        </section>

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

        <section className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
          <BadgeShowcase earned={currentUser.earnedBadges} />
        </section>
      </div>
    </main>
  );
}
