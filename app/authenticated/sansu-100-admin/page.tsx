'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';

import Header from '../../components/header';
import ThemeToggle from '../../components/theme-toggle';
import { sansuAdminApi, type AdminUserSummary } from '../../sansu-100/lib/api-client';

type Summary = {
  totalUsers: number;
  totalSessions: number;
  sessionsByDate: Record<string, number>;
};

export default function SansuAdminHome(): React.JSX.Element {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [users, setUsers] = useState<AdminUserSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([sansuAdminApi.getSummary(), sansuAdminApi.listUsers()])
      .then(([s, u]) => {
        setSummary(s);
        setUsers(u);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'エラー'));
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
        <Header
          title="📋 100マス計算 管理画面"
          description="練習状況の把握とユーザー管理"
          showBackButton
        />

        {error ? (
          <p className="rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-300">
            {error}
          </p>
        ) : null}

        {summary ? (
          <section className="grid grid-cols-3 gap-3 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
            <Stat label="ユーザー数" value={String(summary.totalUsers)} />
            <Stat label="累計セッション" value={String(summary.totalSessions)} />
            <Stat
              label="本日"
              value={String(
                summary.sessionsByDate[new Date().toISOString().slice(0, 10)] ??
                  0
              )}
            />
          </section>
        ) : null}

        <section className="space-y-3 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            👥 ユーザー一覧
          </h2>
          {users === null ? (
            <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
          ) : users.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              まだユーザーが登録されていません
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {users.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/authenticated/sansu-100-admin/user?userId=${encodeURIComponent(u.id)}`}
                    className="block rounded-xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-5xl">{u.avatar}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100">
                          {u.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          色: {u.themeColor} / 作成日:{' '}
                          {new Date(u.createdAt).toLocaleDateString('ja-JP')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          練習 {u.totalSessions}回 / バッジ{' '}
                          {u.earnedBadges.length}個
                        </p>
                        {u.lastPlayedAt > 0 ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            最終練習:{' '}
                            {new Date(u.lastPlayedAt).toLocaleString('ja-JP', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-100 p-3 text-center dark:bg-gray-700">
      <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {value}
      </p>
    </div>
  );
}
