'use client';

import React, { Suspense, useEffect, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import Header from '../../../components/header';
import ThemeToggle from '../../../components/theme-toggle';
import PinPad from '../../components/PinPad';
import { formatDuration } from '../../components/SessionTimer';
import {
  sansuAdminApi,
  sansuApi,
  type AdminUserSummary,
} from '../../lib/api-client';
import { hashPin } from '../../lib/pin-hash';
import type { SansuSession } from '../../lib/types';

function UserDetailInner(): React.JSX.Element {
  const router = useRouter();
  const params = useSearchParams();
  const userId = params.get('userId') ?? '';

  const [user, setUser] = useState<AdminUserSummary | null>(null);
  const [sessions, setSessions] = useState<SansuSession[]>([]);
  const [showReset, setShowReset] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showAvatarReminder, setShowAvatarReminder] = useState(false);

  useEffect(() => {
    if (!userId) {
      router.replace('/sansu-100/admin999');
      return;
    }
    sansuAdminApi
      .listUsers()
      .then((list) => {
        const u = list.find((x) => x.id === userId);
        if (!u) {
          router.replace('/sansu-100/admin999');
          return;
        }
        setUser(u);
      })
      .catch(console.error);
    sansuApi.getSessions(userId).then(setSessions).catch(console.error);
  }, [userId, router]);

  const handleReset = async (pinValue: string = newPin) => {
    if (!user || pinValue.length !== 4) return;
    setResetError(null);
    try {
      const hash = await hashPin(pinValue, user.id);
      await sansuAdminApi.resetPin(user.id, hash, user.id);
      setResetSuccess(true);
      setShowReset(false);
      setNewPin('');
    } catch (e) {
      setResetError(e instanceof Error ? e.message : 'エラー');
    }
  };

  if (!user)
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">読み込み中...</p>
      </main>
    );

  return (
    <main className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
        <Header
          title={`${user.avatar} ${user.name}`}
          description="ユーザー詳細・リカバリー操作"
          showBackButton
          backHref="/sansu-100/admin999"
          backLabel="ユーザー一覧にもどる"
        />

        {/* Identity card */}
        <section className="space-y-4 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <span className="text-7xl">{user.avatar}</span>
            <div className="flex-1 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <p>
                <strong>名前:</strong> {user.name}
              </p>
              <p>
                <strong>テーマカラー:</strong> {user.themeColor}
              </p>
              <p>
                <strong>作成日時:</strong>{' '}
                {new Date(user.createdAt).toLocaleString('ja-JP')}
              </p>
              <p>
                <strong>最終練習:</strong>{' '}
                {user.lastPlayedAt > 0
                  ? new Date(user.lastPlayedAt).toLocaleString('ja-JP')
                  : '—'}
              </p>
              <p>
                <strong>累計:</strong> {user.totalSessions}回 /{' '}
                {user.totalPoints}pt / バッジ {user.earnedBadges.length}個
              </p>
              {user.pinResetAt ? (
                <p className="text-amber-700 dark:text-amber-300">
                  <strong>最終PINリセット:</strong>{' '}
                  {new Date(user.pinResetAt).toLocaleString('ja-JP')}（
                  {user.pinResetBy ?? 'admin'}）
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 dark:border-gray-700 sm:flex-row">
            <button
              type="button"
              onClick={() => setShowAvatarReminder(true)}
              className="flex-1 rounded-lg bg-blue-100 px-4 py-3 font-bold text-blue-900 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-900/60"
            >
              🪞 アバターを教える
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReset(true);
                setResetSuccess(false);
                setResetError(null);
                setNewPin('');
              }}
              className="flex-1 rounded-lg bg-amber-500 px-4 py-3 font-bold text-white hover:bg-amber-600"
            >
              🔑 PIN を再設定
            </button>
          </div>

          {resetSuccess ? (
            <div className="rounded-lg bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/40 dark:text-green-200">
              ✅ PIN を新しく設定しました。お子さんに新しい4桁の番号を伝えてください。
            </div>
          ) : null}
        </section>

        {/* Badges */}
        {user.earnedBadges.length > 0 ? (
          <section className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
            <h2 className="mb-3 text-xl font-bold text-gray-900 dark:text-gray-100">
              🏅 獲得バッジ ({user.earnedBadges.length}個)
            </h2>
            <div className="flex flex-wrap gap-2">
              {user.earnedBadges.map((id) => (
                <span
                  key={id}
                  className="rounded-lg bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200"
                >
                  {id}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {/* Session history */}
        <section className="space-y-3 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            🕒 最近の練習（最新15件）
          </h2>
          {sessions.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">記録なし</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {sessions
                .slice(-15)
                .reverse()
                .map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="text-gray-500 dark:text-gray-400">
                      {new Date(s.completedAt).toLocaleString('ja-JP', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                      Lv.{s.level} {s.operation} · {formatDuration(s.durationMs)}{' '}
                      · {s.correctCount}/{s.totalProblems}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      +{s.pointsEarned}pt
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>

      {/* Avatar reminder fullscreen */}
      {showAvatarReminder ? (
        <button
          type="button"
          className="fixed inset-0 z-50 flex w-full items-center justify-center bg-black/70 p-4"
          onClick={() => setShowAvatarReminder(false)}
          aria-label="アバター表示を閉じる"
        >
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-10 shadow-2xl dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              この子のアバターはこれ
            </p>
            <span className="text-9xl">{user.avatar}</span>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {user.name}
            </p>
            <p className="rounded-lg bg-blue-600 px-6 py-2 font-bold text-white">
              タップで閉じる
            </p>
          </div>
        </button>
      ) : null}

      {/* PIN reset dialog */}
      {showReset ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              新しいPINを設定
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              お子さんに伝える 4桁の番号を入力してください
            </p>
            <PinPad
              value={newPin}
              onChange={setNewPin}
              onSubmit={handleReset}
              error={resetError}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                やめる
              </button>
              <button
                type="button"
                disabled={newPin.length !== 4}
                onClick={() => handleReset()}
                className="flex-1 rounded-lg bg-amber-600 px-4 py-2 font-bold text-white hover:bg-amber-700 disabled:bg-gray-400"
              >
                設定する
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default function Admin999UserDetailPage(): React.JSX.Element {
  return (
    <Suspense fallback={<main className="p-8" />}>
      <UserDetailInner />
    </Suspense>
  );
}
