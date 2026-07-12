'use client';

import React, { useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Header from '../components/header';
import ThemeToggle from '../components/theme-toggle';

import AvatarDisplay from './components/AvatarDisplay';
import CoinBalance from './components/CoinBalance';
import PinPad from './components/PinPad';
import UserTile from './components/UserTile';
import { useSansuSync } from './hooks/useSansuSync';
import { useSansuUser } from './hooks/useSansuUser';
import { sansuApi } from './lib/api-client';
import { isDebugEnv } from './lib/debug-env';
import { hashPin } from './lib/pin-hash';
import type { SansuUserPublic } from './lib/types';

const IS_DEV = process.env.NODE_ENV !== 'production';

export default function SansuHome(): React.JSX.Element {
  useSansuSync();
  const router = useRouter();
  const { recentUsers, currentUser, selectUser, saveUser, loaded, refreshUsers } =
    useSansuUser();
  const seedDone = useRef(false);
  const [selectingUser, setSelectingUser] = useState<SansuUserPublic | null>(
    null
  );
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [debugBusy, setDebugBusy] = useState(false);

  // Auto-seed test users in dev mode on first mount
  useEffect(() => {
    if (!IS_DEV || seedDone.current) return;
    seedDone.current = true;
    import('./lib/dev-seed').then(({ seedDevUsers }) =>
      seedDevUsers().then((seeded) => {
        if (seeded) refreshUsers();
      }).catch(console.warn)
    );
  }, [refreshUsers]);

  const handleSelect = (user: SansuUserPublic) => {
    setSelectingUser(user);
    setPin('');
    setPinError(null);
    setFailedAttempts(0);
  };

  const handleVerifyPin = async (pinValue: string = pin) => {
    if (!selectingUser || pinValue.length !== 4 || verifyingPin) return;
    if (failedAttempts >= 3) {
      setPinError('3回まちがえたよ。すこし まってからもういちど ためしてね');
      return;
    }
    setPinError(null);
    setVerifyingPin(true);
    try {
      const hash = await hashPin(pinValue, selectingUser.id);
      let result: { ok: boolean; user?: SansuUserPublic };
      try {
        result = await sansuApi.verifyPin(selectingUser.id, hash);
      } catch {
        setPinError('サーバーに つながらなかったよ。もういちど ためしてね');
        setPin('');
        return;
      }
      if (result.ok) {
        if ('user' in result && result.user) {
          saveUser(result.user);
        } else {
          selectUser(selectingUser);
        }
        setSelectingUser(null);
      } else {
        setFailedAttempts((n) => n + 1);
        setPinError('あいことばが ちがうみたい');
        setPin('');
      }
    } catch (e) {
      setPinError(e instanceof Error ? e.message : 'エラーが おきたよ');
    } finally {
      setVerifyingPin(false);
    }
  };

  // 構造化データ（検索エンジン向け）。ローディング状態に関わらず常に静的HTMLに出力する。
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '100マス計算',
    url: 'https://snap-content.takumi-oda.com/sansu-100',
    description:
      '足し算・引き算・掛け算の100マス計算を無料でできる学習アプリ。タイムを計測してベスト記録を更新し、毎日の計算練習を習慣化できます。',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    inLanguage: 'ja',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY',
    },
  };

  // SEO向けの説明コンテンツ。クローラが評価できる本文として常に出力する。
  const seoIntro = (
    <section className="sr-only">
      <h1>100マス計算 ｜ 無料の計算ドリル・タイム計測アプリ</h1>
      <p>
        100マス計算（百マス計算）は、足し算・引き算・掛け算を素早く解いて計算力をきたえる定番のトレーニングです。
        本アプリは無料で使え、解き終わるまでのタイムを自動で計測し、ベスト記録の更新を目指して毎日の計算練習を習慣化できます。
      </p>
      <h2>このアプリでできること</h2>
      <ul>
        <li>足し算・引き算・掛け算の100マス計算をブラウザですぐに開始</li>
        <li>解答タイムの自動計測とベスト記録の保存</li>
        <li>練習の履歴やバッジで毎日のがんばりを見える化</li>
        <li>スマホ・タブレット・PCに対応、PWAでアプリのように利用可能</li>
      </ul>
      <h2>こんな方におすすめ</h2>
      <p>
        小学生の計算力アップ、毎日の計算ドリルの習慣づけ、大人の脳トレや暗算トレーニングにも活用できます。
      </p>
    </section>
  );

  if (!loaded)
    return (
      <main className="p-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {seoIntro}
      </main>
    );

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {seoIntro}
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto max-w-3xl space-y-8 px-4 py-8">
        <Header
          title="100マス計算"
          description="じぶんの ベストを ぬりかえよう！"
          showBackButton
        />

        {currentUser ? (
          <section className="space-y-6 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <AvatarDisplay user={currentUser} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    こんにちは
                  </p>
                  <h2 className="truncate text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {currentUser.name}
                  </h2>
                </div>
                <div data-testid="coin-balance">
                  <CoinBalance coins={currentUser.coins} size="md" />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                これまで {currentUser.totalSessions}回 ・ バッジ{' '}
                {currentUser.earnedBadges.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/sansu-100/play')}
              className="w-full rounded-xl bg-blue-600 p-5 text-xl font-bold text-white shadow-md hover:bg-blue-700"
              data-testid="play-btn"
            >
              ▶︎ れんしゅう スタート！
            </button>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/sansu-100/shop"
                className="rounded-lg bg-yellow-200 px-3 py-2 text-center font-semibold text-yellow-900 hover:bg-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-100 dark:hover:bg-yellow-900/60"
              >
                🛍️ おみせ
              </Link>
              <Link
                href="/sansu-100/avatar"
                className="rounded-lg bg-teal-200 px-3 py-2 text-center font-semibold text-teal-900 hover:bg-teal-300 dark:bg-teal-900/40 dark:text-teal-100 dark:hover:bg-teal-900/60"
              >
                🧑‍🎨 キャラづくり
              </Link>
              <Link
                href="/sansu-100/closet"
                className="rounded-lg bg-pink-200 px-3 py-2 text-center font-semibold text-pink-900 hover:bg-pink-300 dark:bg-pink-900/40 dark:text-pink-100 dark:hover:bg-pink-900/60"
              >
                🎨 きせかえ
              </Link>
              <Link
                href="/sansu-100/minigame"
                className="rounded-lg bg-purple-200 px-3 py-2 text-center font-semibold text-purple-900 hover:bg-purple-300 dark:bg-purple-900/40 dark:text-purple-100 dark:hover:bg-purple-900/60"
              >
                🎮 ゲーム
              </Link>
              <Link
                href="/sansu-100/history"
                className="rounded-lg bg-gray-200 px-3 py-2 text-center font-semibold text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                📈 きろく
              </Link>
              <Link
                href="/sansu-100/help"
                className="rounded-lg bg-sky-100 px-3 py-2 text-center font-semibold text-sky-900 hover:bg-sky-200 dark:bg-sky-900/40 dark:text-sky-100 dark:hover:bg-sky-900/60"
                data-testid="help-link"
              >
                ❓ あそびかた
              </Link>
            </div>
            <button
              type="button"
              onClick={() => selectUser(null)}
              className="w-full rounded-lg bg-gray-200 px-4 py-2 text-center font-semibold text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              👋 おわる
            </button>
            {isDebugEnv() ? (
              <div className="space-y-2 rounded-xl border border-dashed border-orange-400 p-3">
                <p className="text-xs font-bold text-orange-600 dark:text-orange-300">
                  🐛 デバッグ（本番では表示されません）
                </p>
                <button
                  type="button"
                  disabled={debugBusy}
                  onClick={async () => {
                    setDebugBusy(true);
                    try {
                      const res = await sansuApi.debugGrant(currentUser.id, 1000);
                      if (res.ok && res.user) saveUser(res.user);
                    } finally {
                      setDebugBusy(false);
                    }
                  }}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600 disabled:opacity-60"
                  data-testid="debug-grant-coins"
                >
                  🪙 コイン +1000
                </button>
              </div>
            ) : null}
          </section>
        ) : (
          <section className="space-y-6 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              だれが あそぶ？
            </h2>
            {recentUsers.length === 0 ? (
              <p className="text-center text-gray-600 dark:text-gray-400">
                まだ だれも とうろくしていないよ
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {recentUsers.map((u) => (
                  <UserTile key={u.id} user={u} onSelect={handleSelect} />
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 dark:border-gray-700 sm:flex-row">
              <Link
                href="/sansu-100/register"
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-center font-bold text-white hover:bg-blue-700"
                data-testid="register-link"
              >
                ＋ あたらしく とうろく
              </Link>
              <Link
                href="/sansu-100/login"
                className="flex-1 rounded-lg bg-gray-200 px-4 py-3 text-center font-bold text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                べつの たんまつで つくったよ
              </Link>
            </div>
          </section>
        )}

        {selectingUser ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => !verifyingPin && setSelectingUser(null)}
          >
            <div
              className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center gap-2">
                <AvatarDisplay user={selectingUser} size="lg" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {selectingUser.name} の あいことば
                </h3>
              </div>
              <PinPad
                value={pin}
                onChange={setPin}
                onSubmit={handleVerifyPin}
                error={pinError}
                disabled={verifyingPin}
                confirmLabel="これでOK！"
              />
              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                わからない時は おうちの人に きいてね
              </p>
              <button
                type="button"
                onClick={() => setSelectingUser(null)}
                disabled={verifyingPin}
                className="w-full rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                やめる
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
