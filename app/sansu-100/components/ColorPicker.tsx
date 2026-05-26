'use client';

import React from 'react';

import { THEME_COLOR_CLASSES, THEME_COLORS } from '../lib/avatar';

interface ColorPickerProps {
  value: string;
  onChange: (v: string) => void;
}

const LABELS: Record<string, string> = {
  pink: 'ピンク',
  blue: 'ブルー',
  green: 'グリーン',
  yellow: 'イエロー',
  purple: 'パープル',
  orange: 'オレンジ',
};

export default function ColorPicker({
  value,
  onChange,
}: ColorPickerProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-6 gap-2">
      {THEME_COLORS.map((c) => {
        const theme = THEME_COLOR_CLASSES[c];
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all ${
              value === c
                ? 'scale-110 border-gray-900 dark:border-white'
                : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            aria-pressed={value === c}
          >
            <span
              className={`block size-10 rounded-full bg-gradient-to-br ${theme.gradient}`}
            />
            <span className="text-xs text-gray-700 dark:text-gray-300">
              {LABELS[c]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
