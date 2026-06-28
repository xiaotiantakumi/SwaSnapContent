'use client';

import React, { useCallback, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Header from '../../../components/header';
import ThemeToggle from '../../../components/theme-toggle';
import BadgeUnlockOverlay from '../../components/BadgeUnlockOverlay';
import CoinBalance from '../../components/CoinBalance';
import NewRecordBanner from '../../components/NewRecordBanner';
import SnakeGame from '../../games/SnakeGame';
import { useSansuUser } from '../../hooks/useSansuUser';
import { sansuApi } from '../../lib/api-client';
import { SPEND_COSTS } from '../../lib/minigame-economy';
import { evaluateMinigameBadges } from '../../lib/minigame-rewards';

type Phase = 'intro' | 'playing' | 'over';

export default function SnakePage(): React.JSX.Element {
  const router = useRouter();
  const { currentUser, saveUser, loaded } = useSansuUser();
  const [phase, setPhase] = useState<Phase>('intro');
  const [lastScore, setLastScore] = useState(0);
  const [round, setRound] = useState(0); // SnakeGame の再マウント用キー
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [overlayBadges, setOverlayBadges] = useState<string[]>([]);
  const [newRecord, setNewRecord] = useState(false);

  const coins = currentUser?.coins ?? 0;
  const highScore = currentUser?.minigameScores?.snake ?? 0;

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
        setMessage('コインが たりないよ');
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
        'snake',
        score,
        currentUser.earnedBadges
      );
      try {
        const res = await sansuApi.awardBadge(
          currentUser.id,
          newBadges,
          score,
          'snake'
        );
        if (res.user) saveUser(res.user);
        if (res.newRecord) setNewRecord(true);
        if (newBadges.length > 0) setOverlayBadges(newBadges);
      } catch {
        // 報酬付与に失敗しても致命的ではない（次回同期で拾える）
      }
    },
    [currentUser, saveUser]
  );

  if (loaded && !currentUser) {
    if (typeof window !== 'undefined') router.replace('/sansu-100');
    return <main className="p-8" />;
  }
  if (!currentUser) return <main className="p-8" />;

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto max-w-md space-y-4 p-4">
        {/* プレイ中はヘッダ/残高カードを隠してコンパクトにし、操作ボタンを画面内に収める */}
        {phase === 'playing' ? (
          <Link
            href="/sansu-100/minigame"
            className="inline-block text-sm font-semibold text-blue-600 dark:text-blue-300"
          >
            ← やめる
          </Link>
        ) : (
          <>
            <Header
              title="🐍 スネーク"
              description="りんごを たべて のびよう！かべと じぶんに きをつけて"
              showBackButton
              backHref="/sansu-100/minigame"
              backLabel="ゲームせんたくにもどる"
            />
            <section className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-md dark:bg-gray-800">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                さいこう:{' '}
                <b className="text-gray-900 dark:text-gray-100">{highScore}</b>
              </span>
              <CoinBalance coins={coins} />
            </section>
          </>
        )}

        {message ? (
          <div className="rounded-xl bg-yellow-100 px-4 py-3 text-center font-bold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
            {message}
          </div>
        ) : null}

        {phase === 'intro' ? (
          <section className="space-y-4 rounded-2xl bg-white p-6 text-center shadow-md dark:bg-gray-800">
            <p className="text-6xl">🐍</p>
            <p className="text-gray-700 dark:text-gray-200">
              コインを {SPEND_COSTS.play}まい つかって あそぶよ
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={start}
              className="w-full rounded-xl bg-purple-600 py-4 text-lg font-bold text-white hover:bg-purple-700 disabled:opacity-60"
              data-testid="snake-start"
            >
              🪙 {SPEND_COSTS.play} であそぶ
            </button>
          </section>
        ) : null}

        {phase === 'playing' ? (
          <section className="rounded-2xl bg-white p-4 shadow-md dark:bg-gray-800">
            <SnakeGame key={round} onGameOver={handleGameOver} />
          </section>
        ) : null}

        {phase === 'over' ? (
          <section className="space-y-4 rounded-2xl bg-white p-6 text-center shadow-md dark:bg-gray-800">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ゲームオーバー
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-200">
              スコア: <b>{lastScore}</b>
            </p>
            {newRecord ? <NewRecordBanner score={lastScore} /> : null}
            <button
              type="button"
              disabled={busy}
              onClick={start}
              className="w-full rounded-xl bg-purple-600 py-4 text-lg font-bold text-white hover:bg-purple-700 disabled:opacity-60"
              data-testid="snake-again"
            >
              🪙 {SPEND_COSTS.play} で もういちど
            </button>
            <Link
              href="/sansu-100/minigame"
              className="block rounded-xl bg-gray-200 py-3 font-bold text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              ほかの ゲームへ
            </Link>
          </section>
        ) : null}
      </div>

      {overlayBadges.length > 0 ? (
        <BadgeUnlockOverlay
          badgeIds={overlayBadges}
          onDone={() => setOverlayBadges([])}
        />
      ) : null}
    </main>
  );
}
