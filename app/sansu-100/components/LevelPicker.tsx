'use client';

import React, { useEffect, useState } from 'react';

import {
  feverIntervalIndex,
  feverLevel,
  feverSecondsRemaining,
  feverUsesLeft,
} from '../lib/fever';
import { LEVELS } from '../lib/levels';
import type { LevelId, Operation } from '../lib/types';

interface LevelPickerProps {
  onPick: (level: LevelId, operation: Operation) => void;
  // フィーバー枠の使用状況（残りルーレット回数の計算に使う）
  feverWindowInterval?: number;
  feverWindowUses?: number;
}

const OP_COLORS: Record<string, string> = {
  add: 'from-green-400 to-green-600',
  sub: 'from-yellow-400 to-yellow-600',
  mul: 'from-red-400 to-red-600',
  div: 'from-purple-400 to-purple-600',
};

export default function LevelPicker({
  onPick,
  feverWindowInterval,
  feverWindowUses,
}: LevelPickerProps): React.JSX.Element {
  // フィーバー(おすすめ)レベルと残り時間。15分ごとに入れ替わる。
  // SSRと食い違わないよう now は 0 で開始し、マウント後に実時刻で更新。
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const feverLv = now > 0 ? feverLevel(now) : null;
  const remain = now > 0 ? feverSecondsRemaining(now) : 0;
  const mmss = `${Math.floor(remain / 60)}:${String(remain % 60).padStart(2, '0')}`;
  // この枠で残っているルーレット回数（使い切ったらバッジを出さない）
  const usesLeft =
    now > 0
      ? feverUsesLeft(feverIntervalIndex(now), feverWindowInterval, feverWindowUses)
      : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {LEVELS.map((lv) => {
          const isFever = feverLv === lv.id && usesLeft > 0;
          return (
            <button
              key={lv.id}
              type="button"
              onClick={() => onPick(lv.id, lv.operation)}
              className={`group rounded-2xl bg-gradient-to-br ${OP_COLORS[lv.operation]} p-5 text-left text-white shadow-md transition-transform hover:scale-[1.02] ${
                isFever ? 'ring-4 ring-orange-400 ring-offset-2 dark:ring-offset-gray-900' : ''
              }`}
              data-testid={`level-pick-${lv.id}`}
            >
              {isFever ? (
                <span
                  className="mb-1 inline-block whitespace-nowrap rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white shadow"
                  data-testid="fever-badge"
                >
                  🔥 ボーナス あと{usesLeft}回 ・ のこり{mmss}
                </span>
              ) : null}
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-bold">{lv.label}</h3>
                <span className="text-sm opacity-90">Lv.{lv.id}</span>
              </div>
              <p className="mt-1 text-sm opacity-90">{lv.description}</p>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => onPick('mix', 'mixed')}
        className="w-full rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5 text-white shadow-md hover:scale-[1.02]"
        data-testid="level-pick-mix"
      >
        <h3 className="text-xl font-bold">🎲 ミックス</h3>
        <p className="mt-1 text-sm opacity-90">いろいろなレベルから ランダム</p>
      </button>
    </div>
  );
}
