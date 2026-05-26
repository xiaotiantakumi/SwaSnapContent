'use client';

import React from 'react';

import { AVATARS } from '../lib/avatar';

interface AvatarPickerProps {
  value: string;
  onChange: (v: string) => void;
}

export default function AvatarPicker({
  value,
  onChange,
}: AvatarPickerProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
      {AVATARS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          className={`flex aspect-square items-center justify-center rounded-xl text-3xl transition-all sm:text-4xl ${
            value === emoji
              ? 'scale-110 bg-blue-100 ring-4 ring-blue-500 dark:bg-blue-900/40'
              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
          }`}
          aria-pressed={value === emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
