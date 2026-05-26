'use client';

import React from 'react';

import { LEVELS } from '../lib/levels';
import type { LevelId, Operation } from '../lib/types';

interface LevelPickerProps {
  onPick: (level: LevelId, operation: Operation) => void;
}

const OP_COLORS: Record<string, string> = {
  add: 'from-green-400 to-green-600',
  sub: 'from-yellow-400 to-yellow-600',
  mul: 'from-red-400 to-red-600',
  div: 'from-purple-400 to-purple-600',
};

export default function LevelPicker({
  onPick,
}: LevelPickerProps): React.JSX.Element {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {LEVELS.map((lv) => (
          <button
            key={lv.id}
            type="button"
            onClick={() => onPick(lv.id, lv.operation)}
            className={`group rounded-2xl bg-gradient-to-br ${OP_COLORS[lv.operation]} p-5 text-left text-white shadow-md transition-transform hover:scale-[1.02]`}
            data-testid={`level-pick-${lv.id}`}
          >
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl font-bold">{lv.label}</h3>
              <span className="text-sm opacity-90">Lv.{lv.id}</span>
            </div>
            <p className="mt-1 text-sm opacity-90">{lv.description}</p>
          </button>
        ))}
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
