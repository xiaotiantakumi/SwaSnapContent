'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import Header from '../../components/header';
import ThemeToggle from '../../components/theme-toggle';
import AvatarDisplay from '../components/AvatarDisplay';
import CoinBalance from '../components/CoinBalance';
import { useSansuUser } from '../hooks/useSansuUser';
import { BADGE_CATALOG } from '../lib/badge-catalog';
import { storage } from '../lib/storage';
import type { SansuSession } from '../lib/types';

const OP_LABELS: Record<string, string> = {
  add: 'たし算',
  sub: 'ひき算',
  mul: 'かけ算',
  div: 'わり算',
  mixed: 'ミックス',
};

function formatDurationMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}時間${m}分`;
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function StatCard({
  label,
  value,
  sub,
  emoji,
}: {
  label: string;
  value: string;
  sub?: string;
  emoji: string;
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-white p-4 text-center shadow-sm dark:bg-gray-800">
      <span className="text-2xl">{emoji}</span>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {sub ? <p className="text-xs text-gray-400">{sub}</p> : null}
    </div>
  );
}

export default function ProfilePage(): React.JSX.Element {
  const router = useRouter();
  const { currentUser, loaded } = useSansuUser();
  const [sessions, setSessions] = useState<SansuSession[]>([]);

  useEffect(() => {
    if (!loaded) return;
    if (!currentUser) {
      router.replace('/sansu-100');
      return;
    }
    setSessions(storage.getSessions(currentUser.id));
  }, [loaded, currentUser, router]);

  const stats = useMemo(() => {
    if (sessions.length === 0) return null;

    const totalMs = sessions.reduce((s, r) => s + r.durationMs, 0);
    const totalCorrect = sessions.reduce((s, r) => s + r.correctCount, 0);
    const totalProblems = sessions.reduce((s, r) => s + r.totalProblems, 0);
    const avgAccuracy = totalProblems > 0 ? Math.round((totalCorrect / totalProblems) * 100) : 0;

    // 得意演算（最多練習回数）
    const opCount = new Map<string, number>();
    for (const s of sessions) {
      opCount.set(s.operation, (opCount.get(s.operation) ?? 0) + 1);
    }
    let favoriteOp = '';
    let maxCount = 0;
    for (const [op, cnt] of opCount.entries()) {
      if (cnt > maxCount) { maxCount = cnt; favoriteOp = op; }
    }

    // 最速タイム（パーフェクトのみ）
    const perfectSessions = sessions.filter((s) => s.correctCount === s.totalProblems);
    const fastestMs = perfectSessions.length > 0
      ? Math.min(...perfectSessions.map((s) => s.durationMs))
      : null;

    // 初回練習日
    const firstAt = Math.min(...sessions.map((s) => s.completedAt));

    return { totalMs, avgAccuracy, favoriteOp, fastestMs, firstAt };
  }, [sessions]);

  if (!loaded || !currentUser) return <main className="p-8" />;

  const badgeCount = currentUser.earnedBadges.length;
  const totalBadges = BADGE_CATALOG.length;

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
        <Header
          title="プロフィール"
          description="じぶんの がんばりを みてみよう"
          showBackButton
          backHref="/sansu-100"
          backLabel="ホームにもどる"
        />

        {/* ユーザー情報 */}
        <section
          className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800"
          data-testid="profile-header"
        >
          <AvatarDisplay user={currentUser} size="lg" />
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="truncate text-2xl font-bold text-gray-900 dark:text-gray-100">
              {currentUser.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stats ? `${formatDate(stats.firstAt)} かられんしゅうちゅう` : 'まだれんしゅうしていないよ'}
            </p>
          </div>
          <CoinBalance coins={currentUser.coins} size="md" />
        </section>

        {/* 統計グリッド */}
        <section className="space-y-2" data-testid="profile-stats">
          <h3 className="font-bold text-gray-700 dark:text-gray-300">📊 きろく</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard
              emoji="🏃"
              label="累計かいすう"
              value={`${currentUser.totalSessions}回`}
            />
            <StatCard
              emoji="⏱️"
              label="累計れんしゅう時間"
              value={stats ? formatDurationMs(stats.totalMs) : '0秒'}
            />
            <StatCard
              emoji="✅"
              label="平均 正かい率"
              value={stats ? `${stats.avgAccuracy}%` : '-'}
            />
            <StatCard
              emoji="⭐"
              label="得意な演算"
              value={stats ? (OP_LABELS[stats.favoriteOp] ?? '-') : '-'}
            />
            <StatCard
              emoji="⚡"
              label="最速タイム"
              value={stats?.fastestMs != null ? formatDurationMs(stats.fastestMs) : '-'}
              sub={stats?.fastestMs != null ? 'パーフェクト時' : undefined}
            />
            <StatCard
              emoji="🏅"
              label="バッジ"
              value={`${badgeCount} / ${totalBadges}`}
              sub="個とった"
            />
          </div>
        </section>

        {/* 取得バッジ一覧（最新5個） */}
        {badgeCount > 0 ? (
          <section className="space-y-2 rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
            <h3 className="font-bold text-gray-700 dark:text-gray-300">🏅 さいきんのバッジ</h3>
            <div className="flex flex-wrap gap-2">
              {currentUser.earnedBadges.slice(-5).map((id) => {
                const def = BADGE_CATALOG.find((b) => b.id === id);
                return def ? (
                  <span
                    key={id}
                    title={def.description}
                    className="rounded-xl bg-yellow-100 px-2 py-1 text-sm dark:bg-yellow-900/30"
                  >
                    {def.icon} {def.name}
                  </span>
                ) : null;
              })}
            </div>
            <a
              href="/sansu-100/history"
              className="mt-1 block text-xs text-blue-500 underline hover:text-blue-700"
              data-testid="profile-history-link"
            >
              きろく・バッジをもっと見る →
            </a>
          </section>
        ) : null}
      </div>
    </main>
  );
}
