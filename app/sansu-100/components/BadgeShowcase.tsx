'use client';

import React from 'react';

import { BADGE_CATALOG, TIER_COLORS, type BadgeDef } from '../lib/badge-catalog';

interface BadgeShowcaseProps {
  earned: string[];
}

const CATEGORY_LABELS: Record<BadgeDef['category'], string> = {
  sessions: '🏃 れんしゅう回数',
  perfect: '💯 パーフェクト',
  speed: '⚡ スピード',
  streak: '🔥 れんぞく日数',
  master: '🎓 演算マスター',
  timing: '🕐 じかんたい',
  daily: '📅 デイリー',
  special: '✨ とくべつ',
  meta: '🏆 メタ',
};

export default function BadgeShowcase({
  earned,
}: BadgeShowcaseProps): React.JSX.Element {
  const earnedSet = new Set(earned);
  const categories = Array.from(
    new Set(BADGE_CATALOG.map((b) => b.category))
  );

  return (
    <div className="space-y-6" data-testid="badge-showcase">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          🏅 バッジコレクション
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {earned.length} / {BADGE_CATALOG.length} 個
        </p>
      </div>
      {categories.map((cat) => {
        const badges = BADGE_CATALOG.filter((b) => b.category === cat);
        return (
          <div key={cat} className="space-y-2">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {CATEGORY_LABELS[cat]}
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {badges.map((b) => {
                const has = earnedSet.has(b.id);
                return (
                  <div
                    key={b.id}
                    className={`flex flex-col items-center gap-1 rounded-xl p-2 text-center transition-all ${
                      has
                        ? `bg-gradient-to-br ${TIER_COLORS[b.tier]} shadow-md`
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                    title={has ? b.description : '？？？'}
                  >
                    <span
                      className={`text-3xl ${has ? '' : 'opacity-30 grayscale'}`}
                    >
                      {has ? b.icon : '❓'}
                    </span>
                    <span
                      className={`text-xs font-bold leading-tight ${
                        has ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {has ? b.name : '？？？'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
