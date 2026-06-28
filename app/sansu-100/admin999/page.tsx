'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';

import Header from '../../components/header';
import ThemeToggle from '../../components/theme-toggle';
import AvatarDisplay from '../components/AvatarDisplay';
import { sansuAdminApi, type AdminUserSummary } from '../lib/api-client';

type Summary = {
  totalUsers: number;
  totalSessions: number;
  sessionsByDate: Record<string, number>;
};

export default function SansuAdmin999Home(): React.JSX.Element {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [users, setUsers] = useState<AdminUserSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([sansuAdminApi.getSummary(), sansuAdminApi.listUsers()])
      .then(([s, u]) => {
        setSummary(s);
        setUsers(u);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'エラー'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
        <Header
          title="📋 管理画面"
          description="練習状況の把握とユーザー管理"
          showBackButton
          backHref="/sansu-100"
          backLabel="ホームにもどる"
        />

        {error ? (
          <p className="rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-300">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            読み込み中...
          </p>
        ) : null}

        {summary ? (
          <section className="grid grid-cols-3 gap-3 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
            <Stat label="ユーザー数" value={String(summary.totalUsers)} />
            <Stat label="累計セッション" value={String(summary.totalSessions)} />
            <Stat
              label="本日"
              value={String(
                summary.sessionsByDate[new Date().toISOString().slice(0, 10)] ?? 0
              )}
            />
          </section>
        ) : null}

        <section className="space-y-3 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            👥 ユーザー一覧
          </h2>
          {!loading && users !== null && users.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              まだユーザーが登録されていません
            </p>
          ) : null}
          {users && users.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {users.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/sansu-100/admin999/user?userId=${encodeURIComponent(u.id)}`}
                    className="block rounded-xl border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <AvatarDisplay user={u} size="md" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100">
                          {u.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          練習 {u.totalSessions}回 / {u.totalPoints}pt / バッジ{' '}
                          {u.earnedBadges.length}個
                        </p>
                        {u.lastPlayedAt > 0 ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            最終:{' '}
                            {new Date(u.lastPlayedAt).toLocaleString('ja-JP', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            まだ練習していない
                          </p>
                        )}
                      </div>
                      <span className="text-gray-400 dark:text-gray-500">›</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
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
