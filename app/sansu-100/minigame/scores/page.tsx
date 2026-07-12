'use client';

import React, { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import Header from '../../../components/header';
import ThemeToggle from '../../../components/theme-toggle';
import { useSansuUser } from '../../hooks/useSansuUser';
import { MINIGAMES } from '../../lib/minigame-list';

export default function MinigameScoresPage(): React.JSX.Element {
  const router = useRouter();
  const { currentUser, loaded } = useSansuUser();

  useEffect(() => {
    if (loaded && !currentUser) router.replace('/sansu-100');
  }, [loaded, currentUser, router]);

  if (!currentUser) return <main className="p-8" />;

  const scores = currentUser.minigameScores ?? {};
  const available = MINIGAMES.filter((m) => m.available);

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
        <Header
          title="🏆 マイベスト"
          description="ミニゲームの ベストスコア"
          showBackButton
          backHref="/sansu-100/minigame"
          backLabel="ミニゲームにもどる"
        />

        <section className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700" data-testid="scores-list">
            {available.map((game) => {
              const best = scores[game.id];
              return (
                <li
                  key={game.id}
                  className="flex items-center justify-between py-3"
                  data-testid={`score-row-${game.id}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden>{game.emoji}</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {game.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {game.desc}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {best !== undefined ? (
                      <>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-300">
                          {best.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">てん</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        まだ あそんでないよ
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}
