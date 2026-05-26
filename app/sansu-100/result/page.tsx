'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Header from '../../components/header';
import ThemeToggle from '../../components/theme-toggle';
import BadgeUnlockOverlay from '../components/BadgeUnlockOverlay';
import { formatDuration } from '../components/SessionTimer';
import { useSansuUser } from '../hooks/useSansuUser';
import type { SansuSession } from '../lib/types';

type LastResult = {
  session: SansuSession;
  newBadges: string[];
  pointsEarned: number;
  bestKey: string;
  previousBest: number | null;
};

export default function ResultPage(): React.JSX.Element {
  const router = useRouter();
  const { currentUser } = useSansuUser();
  const [result, setResult] = useState<LastResult | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('sansu-100:last-result');
    if (!raw) {
      router.replace('/sansu-100');
      return;
    }
    try {
      const parsed = JSON.parse(raw) as LastResult;
      setResult(parsed);
      if (parsed.newBadges.length > 0) {
        setShowOverlay(true);
      }
    } catch {
      router.replace('/sansu-100');
    }
  }, [router]);

  if (!result || !currentUser) return <main className="p-8" />;

  const { session, newBadges, pointsEarned, previousBest } = result;
  const accuracy = Math.round(
    (session.correctCount / session.totalProblems) * 100
  );
  const isPerfect = session.correctCount === session.totalProblems;
  const newBestUpdated =
    isPerfect && (previousBest === null || session.durationMs < previousBest);

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
        <Header
          title={isPerfect ? '🎉 パーフェクト！' : 'おつかれさま！'}
          description={`Lv.${session.level} ${session.operation}`}
          showBackButton
          backHref="/sansu-100"
          backLabel="ホームにもどる"
        />

        <section className="space-y-6 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="タイム" value={formatDuration(session.durationMs)} highlight={newBestUpdated} />
            <Stat label="せいかい" value={`${session.correctCount}/${session.totalProblems}`} />
            <Stat label="せいかい率" value={`${accuracy}%`} />
            <Stat label="ポイント" value={`+${pointsEarned}`} highlight />
          </div>

          {newBestUpdated ? (
            <div className="rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-3 text-center font-bold text-white shadow">
              🏆 じぶんの ベストを ぬりかえたよ！
              {previousBest !== null && (
                <span className="ml-2 text-sm font-normal opacity-90">
                  まえの ベスト: {formatDuration(previousBest)}
                </span>
              )}
            </div>
          ) : null}

          {newBadges.length > 0 ? (
            <div className="rounded-xl bg-gradient-to-r from-pink-500 via-yellow-400 to-purple-500 p-1">
              <div className="rounded-[10px] bg-white px-4 py-3 dark:bg-gray-800">
                <p className="font-bold text-gray-900 dark:text-gray-100">
                  ✨ あたらしい バッジ × {newBadges.length}
                </p>
                <button
                  type="button"
                  onClick={() => setShowOverlay(true)}
                  className="mt-2 rounded-lg bg-purple-600 px-4 py-1 text-sm font-bold text-white hover:bg-purple-700"
                >
                  もういちど みる
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => router.replace('/sansu-100/play')}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700"
            >
              🔁 もう1かい
            </button>
            <Link
              href="/sansu-100/history"
              className="flex-1 rounded-lg bg-gray-200 px-4 py-3 text-center font-bold text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              📈 きろくをみる
            </Link>
            <Link
              href="/sansu-100"
              className="flex-1 rounded-lg bg-gray-200 px-4 py-3 text-center font-bold text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              🏠 ホーム
            </Link>
          </div>
        </section>
      </div>

      {showOverlay && newBadges.length > 0 ? (
        <BadgeUnlockOverlay
          badgeIds={newBadges}
          onDone={() => setShowOverlay(false)}
        />
      ) : null}
    </main>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 text-center ${
        highlight
          ? 'bg-yellow-100 dark:bg-yellow-900/30'
          : 'bg-gray-100 dark:bg-gray-700'
      }`}
    >
      <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
        {value}
      </p>
    </div>
  );
}
