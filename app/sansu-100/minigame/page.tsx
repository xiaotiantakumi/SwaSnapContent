'use client';

import React from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Header from '../../components/header';
import ThemeToggle from '../../components/theme-toggle';
import CoinBalance from '../components/CoinBalance';
import { useSansuUser } from '../hooks/useSansuUser';
import { SPEND_COSTS } from '../lib/minigame-economy';
import { MINIGAMES } from '../lib/minigame-list';

// ミニゲームのハブ画面。コインで遊ぶ（参加費）。報酬は限定バッジ＝コインは増えない。
export default function MinigameHubPage(): React.JSX.Element {
  const router = useRouter();
  const { currentUser, loaded } = useSansuUser();

  if (loaded && !currentUser) {
    if (typeof window !== 'undefined') router.replace('/sansu-100');
    return <main className="p-8" />;
  }
  if (!currentUser) return <main className="p-8" />;

  const coins = currentUser.coins ?? 0;

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
        <Header
          title="🎮 ミニゲーム"
          description={`コインを つかって あそぼう（1かい ${SPEND_COSTS.play}コイン）`}
          showBackButton
          backHref="/sansu-100"
          backLabel="ホームにもどる"
        />

        <section className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-md dark:bg-gray-800">
          <p className="font-bold text-gray-900 dark:text-gray-100">
            もっているコイン
          </p>
          <CoinBalance coins={coins} size="lg" />
        </section>

        <div className="grid grid-cols-2 gap-3">
          {MINIGAMES.map((g) => {
            const best = currentUser.minigameScores?.[g.id];
            const card = (
              <div className="flex h-full flex-col items-center gap-1 rounded-2xl bg-white p-4 text-center shadow-md dark:bg-gray-800">
                <span className="text-4xl" aria-hidden>
                  {g.emoji}
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {g.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {g.desc}
                </span>
                {typeof best === 'number' && best > 0 ? (
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-300">
                    🏆 さいこう {best}
                  </span>
                ) : null}
                {g.available ? (
                  <span className="mt-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                    🪙 {SPEND_COSTS.play} であそぶ
                  </span>
                ) : (
                  <span className="mt-1 rounded-full bg-gray-200 px-3 py-1 text-sm font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    じゅんびちゅう
                  </span>
                )}
              </div>
            );
            return g.available ? (
              <Link
                key={g.id}
                href={`/sansu-100/minigame/${g.id}`}
                className="transition-transform hover:scale-105"
                data-testid={`minigame-${g.id}`}
              >
                {card}
              </Link>
            ) : (
              <div key={g.id} className="opacity-70">
                {card}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
