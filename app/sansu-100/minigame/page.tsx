'use client';

import React from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Header from '../../components/header';
import ThemeToggle from '../../components/theme-toggle';
import CoinBalance from '../components/CoinBalance';
import { useSansuUser } from '../hooks/useSansuUser';
import {
  MINIGAME_PLAYS_PER_MATH,
  SPEND_COSTS,
} from '../lib/minigame-economy';
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
  const playCredits = currentUser.minigameCredits ?? 0;

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
          <div>
            <p className="font-bold text-gray-900 dark:text-gray-100">
              もっているコイン
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              あそべる かいすう:{' '}
              <span className="font-bold text-purple-600 dark:text-purple-300">
                {playCredits}
              </span>
            </p>
          </div>
          <CoinBalance coins={coins} size="lg" />
        </section>

        {playCredits <= 0 ? (
          <Link
            href="/sansu-100/play"
            className="block rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 p-5 text-center font-bold text-white shadow-md"
            data-testid="math-gate"
          >
            🧮 さんすうを 1かい といたら、ゲームが {MINIGAME_PLAYS_PER_MATH}
            かい あそべるよ！
            <span className="mt-1 block text-sm font-normal opacity-90">
              タップして れんしゅうへ →
            </span>
          </Link>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          {MINIGAMES.map((g) => {
            const locked = playCredits <= 0;
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
                {!g.available ? (
                  <span className="mt-1 rounded-full bg-gray-200 px-3 py-1 text-sm font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    じゅんびちゅう
                  </span>
                ) : locked ? (
                  <span className="mt-1 whitespace-nowrap rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700 dark:bg-orange-900/40 dark:text-orange-200">
                    🧮 さんすうしてね
                  </span>
                ) : (
                  <span className="mt-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                    🪙 {SPEND_COSTS.play} であそぶ
                  </span>
                )}
              </div>
            );
            return g.available && !locked ? (
              <Link
                key={g.id}
                href={`/sansu-100/minigame/${g.id}`}
                className="transition-transform hover:scale-105"
                data-testid={`minigame-${g.id}`}
              >
                {card}
              </Link>
            ) : (
              <div
                key={g.id}
                className={g.available && locked ? 'opacity-60' : 'opacity-70'}
              >
                {card}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
