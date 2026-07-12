'use client';

import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import Header from '../../components/header';
import ThemeToggle from '../../components/theme-toggle';
import { useSansuUser } from '../hooks/useSansuUser';
import {
  BADGE_CATALOG,
  TIER_COLORS,
  type BadgeDef,
} from '../lib/badge-catalog';

const CATEGORY_LABELS: Record<BadgeDef['category'], string> = {
  sessions: '🏃 れんしゅう回数',
  perfect: '💯 パーフェクト',
  speed: '⚡ スピード',
  streak: '🔥 れんぞく日数',
  master: '🎓 演算マスター',
  timing: '🕐 じかんたい',
  special: '✨ とくべつ',
  minigame: '🎮 ミニゲーム',
  meta: '🏆 メタ',
};

const CATEGORIES = [
  'all',
  'sessions',
  'perfect',
  'speed',
  'streak',
  'master',
  'timing',
  'special',
  'minigame',
  'meta',
] as const;

type Tab = (typeof CATEGORIES)[number];

export default function BadgesPage(): React.JSX.Element {
  const router = useRouter();
  const { currentUser, loaded } = useSansuUser();
  const [tab, setTab] = useState<Tab>('all');
  const [selected, setSelected] = useState<BadgeDef | null>(null);

  useEffect(() => {
    if (!loaded) return;
    if (!currentUser) router.replace('/sansu-100');
  }, [loaded, currentUser, router]);

  if (!loaded || !currentUser) return <main className="p-8" />;

  const earnedSet = new Set(currentUser.earnedBadges);
  const visible =
    tab === 'all'
      ? BADGE_CATALOG
      : BADGE_CATALOG.filter((b) => b.category === tab);
  const earnedCount = currentUser.earnedBadges.length;

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 dark:bg-gray-900">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
        <Header
          title="🏅 バッジ図鑑"
          description={`${earnedCount} / ${BADGE_CATALOG.length} 個ゲット！`}
          showBackButton
          backHref="/sansu-100"
          backLabel="ホームにもどる"
        />

        {/* Progress bar */}
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800" data-testid="badge-progress">
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              コレクション進捗
            </span>
            <span className="text-blue-600 dark:text-blue-300">
              {Math.round((earnedCount / BADGE_CATALOG.length) * 100)}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
              style={{ width: `${(earnedCount / BADGE_CATALOG.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2" data-testid="category-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setTab(cat)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                tab === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-blue-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              data-testid={`tab-${cat}`}
            >
              {cat === 'all'
                ? 'すべて'
                : CATEGORY_LABELS[cat as BadgeDef['category']]}
            </button>
          ))}
        </div>

        {/* Badge grid */}
        <div
          className="grid grid-cols-3 gap-3 sm:grid-cols-4"
          data-testid="badge-grid"
        >
          {visible.map((b) => {
            const has = earnedSet.has(b.id);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelected(b)}
                className={`flex flex-col items-center gap-1 rounded-xl p-3 text-center transition-all active:scale-95 ${
                  has
                    ? `bg-gradient-to-br ${TIER_COLORS[b.tier]} shadow-md`
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
                data-testid={`badge-${b.id}`}
              >
                <span className={`text-4xl ${has ? '' : 'opacity-30 grayscale'}`}>
                  {b.icon}
                </span>
                <span
                  className={`text-xs font-bold leading-tight ${
                    has
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {b.name}
                </span>
                {has ? (
                  <span className="mt-0.5 rounded-full bg-white/30 px-1.5 py-0.5 text-xs font-semibold text-gray-800">
                    ✓ ゲット
                  </span>
                ) : (
                  <span className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    🔒
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail modal */}
      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelected(null)}
          data-testid="badge-detail-modal"
        >
          <div
            className="w-full max-w-xs space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const has = earnedSet.has(selected.id);
              return (
                <>
                  <div className="flex flex-col items-center gap-2">
                    <span
                      className={`text-6xl ${has ? '' : 'opacity-40 grayscale'}`}
                    >
                      {selected.icon}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {selected.name}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${has ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}
                    >
                      {has ? '✓ ゲット済み' : '🔒 みロック'}
                    </span>
                  </div>
                  <p className="text-center text-sm text-gray-700 dark:text-gray-300">
                    {selected.description}
                  </p>
                  <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                    カテゴリ:{' '}
                    {CATEGORY_LABELS[selected.category]}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="w-full rounded-xl bg-gray-200 py-2 font-bold text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    とじる
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      ) : null}
    </main>
  );
}
