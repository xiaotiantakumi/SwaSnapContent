'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Header from '../../components/header';
import ThemeToggle from '../../components/theme-toggle';
import BadgeUnlockOverlay from '../components/BadgeUnlockOverlay';
import CoinBalance from '../components/CoinBalance';
import FeverRoulette from '../components/FeverRoulette';
import { formatDuration } from '../components/SessionTimer';
import { useSansuUser } from '../hooks/useSansuUser';
import { sansuApi } from '../lib/api-client';
import type { CoinBreakdownEntry } from '../lib/coins';
import type { AnsweredProblem, SansuSession } from '../lib/types';

const OP_SIGN: Record<string, string> = { add: '+', sub: '−', mul: '×', div: '÷' };

type LastResult = {
  userId?: string;
  session: SansuSession;
  newBadges: string[];
  pointsEarned: number;
  coinsEarned?: number;
  coinBreakdown?: CoinBreakdownEntry[];
  coinsAfter?: number;
  bestKey: string;
  previousBest: number | null;
  feverEligible?: boolean;
  problems?: AnsweredProblem[];
};

export default function ResultPage(): React.JSX.Element {
  const router = useRouter();
  const { currentUser, saveUser } = useSansuUser();
  const [result, setResult] = useState<LastResult | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [feverClaimed, setFeverClaimed] = useState(false);
  const [feverBonus, setFeverBonus] = useState(0);
  const [feverMult, setFeverMult] = useState(0);
  const [claimedCoins, setClaimedCoins] = useState<number | null>(null);

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
  const coinsEarned = result.coinsEarned ?? 0;
  const coinBreakdown = (result.coinBreakdown ?? []).filter((e) => e.amount !== 0);
  const coinsAfter = result.coinsAfter ?? currentUser.coins ?? 0;
  const displayCoins = claimedCoins ?? coinsAfter;

  // ルーレットで止めた倍率をサーバーに適用（pending を消費）
  const onRoulette = async (mult: number) => {
    const uid = result.userId;
    if (uid) {
      try {
        const res = await sansuApi.claimFever(uid, mult);
        if (res.ok && res.user) {
          saveUser(res.user);
          setFeverBonus(res.bonus ?? 0);
          setFeverMult(res.multiplier ?? mult);
          setClaimedCoins(res.user.coins ?? coinsAfter);
        }
      } catch {
        // 通信不可は無視（ボーナスなしで結果のみ）
      }
    }
    setFeverClaimed(true);
  };
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

          <CoinEarnedCard
            coinsEarned={coinsEarned}
            coinsAfter={displayCoins}
            breakdown={coinBreakdown}
          />

          {result.feverEligible && !feverClaimed ? (
            <FeverRoulette onResult={onRoulette} />
          ) : null}

          {feverClaimed && feverBonus > 0 ? (
            <div className="rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 px-4 py-3 text-center font-extrabold text-white shadow">
              🔥 フィーバー ×{feverMult}！ +{feverBonus} コイン ボーナス！
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

          <WrongReview problems={result.problems} />

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

function CoinEarnedCard({
  coinsEarned,
  coinsAfter,
  breakdown,
}: {
  coinsEarned: number;
  coinsAfter: number;
  breakdown: CoinBreakdownEntry[];
}): React.JSX.Element | null {
  if (coinsEarned <= 0) return null;
  return (
    <div className="rounded-xl bg-yellow-50 px-4 py-3 dark:bg-yellow-900/20">
      <div className="flex items-center justify-between">
        <p className="font-bold text-yellow-800 dark:text-yellow-200">
          🪙 コインを +{coinsEarned} ゲット！
        </p>
        <span className="text-sm text-yellow-700 dark:text-yellow-300">
          もっている: <CoinBalance coins={coinsAfter} size="sm" />
        </span>
      </div>
      {breakdown.length > 1 ? (
        <ul className="mt-2 space-y-0.5 text-sm text-yellow-700 dark:text-yellow-300">
          {breakdown.map((e, i) => (
            <li key={i} className="flex justify-between">
              <span>{e.label}</span>
              <span className="tabular-nums">
                {e.amount >= 0 ? `+${e.amount}` : e.amount}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function WrongReview({
  problems,
}: {
  problems?: AnsweredProblem[];
}): React.JSX.Element | null {
  if (!problems) return null;
  const wrong = problems.filter((p) => !p.isCorrect);
  if (wrong.length === 0) return null;
  return (
    <div
      className="rounded-xl bg-red-50 px-4 py-3 dark:bg-red-900/20"
      data-testid="wrong-review-section"
    >
      <p className="mb-2 font-bold text-red-700 dark:text-red-300">
        ❌ まちがえた もんだい × {wrong.length}
      </p>
      <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3">
        {wrong.map((p, i) => {
          const sign = OP_SIGN[p.op] ?? p.op;
          return (
            <li
              key={i}
              className="rounded-lg bg-white px-3 py-2 text-sm dark:bg-gray-700"
            >
              <span className="text-gray-700 dark:text-gray-300">
                {p.a} {sign} {p.b} ={' '}
              </span>
              <span className="font-bold text-green-600 dark:text-green-400">
                {p.answer}
                {p.remainder !== undefined ? ` あまり ${p.remainder}` : ''}
              </span>
              {p.userAnswer !== -1 && (
                <span className="ml-1 text-xs text-red-500">
                  （{p.userAnswer}）
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
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
