'use client';

import React, { useCallback, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Header from '../../../components/header';
import ThemeToggle from '../../../components/theme-toggle';
import BadgeUnlockOverlay from '../../components/BadgeUnlockOverlay';
import CoinBalance from '../../components/CoinBalance';
import HowToPlay from '../../components/HowToPlay';
import NewRecordBanner from '../../components/NewRecordBanner';
import NumberPopGame from '../../games/NumberPopGame';
import { useSansuUser } from '../../hooks/useSansuUser';
import { sansuApi } from '../../lib/api-client';
import { SPEND_COSTS } from '../../lib/minigame-economy';
import { minigameHowTo } from '../../lib/minigame-list';
import { evaluateMinigameBadges } from '../../lib/minigame-rewards';

type Phase = 'intro' | 'playing' | 'over';

export default function NumberPopPage(): React.JSX.Element {
  const router = useRouter();
  const { currentUser, saveUser, loaded } = useSansuUser();
  const [phase, setPhase] = useState<Phase>('intro');
  const [lastScore, setLastScore] = useState(0);
  const [round, setRound] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [overlayBadges, setOverlayBadges] = useState<string[]>([]);
  const [newRecord, setNewRecord] = useState(false);

  const coins = currentUser?.coins ?? 0;
  const highScore = currentUser?.minigameScores?.numberpop ?? 0;

  const start = useCallback(async () => {
    if (!currentUser) return;
    setBusy(true);
    setMessage(null);
    setNewRecord(false);
    try {
      const res = await sansuApi.spend(currentUser.id, 'play');
      if (res.ok && res.user) {
        saveUser(res.user);
        setRound((r) => r + 1);
        setPhase('playing');
      } else {
        setMessage(
          res.error === 'no_plays'
            ? '🧮 さんすうを 1かい といてから あそぼう！'
            : 'コインが たりないよ'
        );
      }
    } catch {
      setMessage('いまは つうしんできないよ（あとでね）');
    } finally {
      setBusy(false);
    }
  }, [currentUser, saveUser]);

  const handleGameOver = useCallback(
    async (score: number) => {
      setLastScore(score);
      setPhase('over');
      if (!currentUser) return;

      const newBadges = evaluateMinigameBadges(
        'numberpop',
        score,
        currentUser.earnedBadges
      );

      try {
        const res = await sansuApi.awardBadge(
          currentUser.id,
          newBadges,
          score,
          'numberpop'
        );
        if (res.user) saveUser(res.user);
        if (res.newRecord) setNewRecord(true);
        if (newBadges.length > 0) setOverlayBadges(newBadges);
      } catch {
        // 報酬付与に失敗しても致命的ではない
      }
    },
    [currentUser, saveUser]
  );

  if (!loaded || !currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Link href="/sansu-100" className="text-blue-600 underline">
          ← もどる
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <BadgeUnlockOverlay
        badgeIds={overlayBadges}
        onDone={() => setOverlayBadges([])}
      />

      <div className="container mx-auto flex max-w-md flex-col gap-4 px-4 py-6">
        <Header
          title="🔢 かずならべ"
          description="ちいさい じゅんに タップ！"
          showBackButton
          backHref="/sansu-100/minigame"
          backLabel="ゲームにもどる"
        />

        <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm dark:bg-gray-800">
          <div data-testid="coin-balance">
            <CoinBalance coins={coins} size="sm" />
          </div>
          <div className="text-right text-sm">
            <p className="text-gray-500 dark:text-gray-400">ベストスコア</p>
            <p className="font-bold text-gray-900 dark:text-gray-100">
              {highScore}
            </p>
          </div>
        </div>

        {phase === 'intro' ? (
          <section className="space-y-4 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
            <HowToPlay steps={minigameHowTo('numberpop')} />
            {message ? (
              <p className="rounded-lg bg-yellow-50 p-3 text-center text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                {message}
              </p>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={start}
              className="w-full rounded-xl bg-blue-600 py-4 text-xl font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-60"
              data-testid="start-btn"
            >
              {busy ? 'じゅんびちゅう...' : `▶ あそぶ（${SPEND_COSTS.play}コイン）`}
            </button>
          </section>
        ) : phase === 'playing' ? (
          <section
            className="rounded-2xl bg-white p-3 shadow-md dark:bg-gray-800"
            style={{ minHeight: '420px' }}
          >
            <NumberPopGame key={round} onGameOver={handleGameOver} />
          </section>
        ) : (
          <section className="space-y-4 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
            {newRecord ? <NewRecordBanner score={lastScore} /> : null}
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                ゲームおわり！
              </p>
              <p className="mt-1 text-4xl font-bold text-blue-600 dark:text-blue-300">
                {lastScore}てん
              </p>
              {lastScore > highScore ? null : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ベスト: {highScore}てん
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={start}
                className="rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                data-testid="retry-btn"
              >
                {busy ? 'じゅんびちゅう...' : `もう1かい（${SPEND_COSTS.play}コイン）`}
              </button>
              <Link
                href="/sansu-100/minigame"
                className="rounded-xl bg-gray-200 py-3 text-center font-bold text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                ゲームえらび
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
