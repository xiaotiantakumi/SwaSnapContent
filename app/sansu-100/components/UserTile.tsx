'use client';

import React from 'react';

import { getThemeClasses } from '../lib/avatar';
import type { SansuUserPublic } from '../lib/types';

interface UserTileProps {
  user: SansuUserPublic;
  onSelect: (user: SansuUserPublic) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function UserTile({
  user,
  onSelect,
  size = 'md',
}: UserTileProps): React.JSX.Element {
  const theme = getThemeClasses(user.themeColor);
  const sizes = {
    sm: { wrap: 'p-3', emoji: 'text-4xl', label: 'text-sm' },
    md: { wrap: 'p-5', emoji: 'text-6xl', label: 'text-lg' },
    lg: { wrap: 'p-7', emoji: 'text-7xl', label: 'text-xl' },
  }[size];

  return (
    <button
      type="button"
      onClick={() => onSelect(user)}
      className={`flex flex-col items-center gap-2 rounded-2xl ${theme.bg} ${sizes.wrap} hover: ring-4 ring-transparent transition-all hover:scale-105${theme.ring} hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-offset-gray-900`}
      data-testid={`user-tile-${user.id}`}
    >
      <span className={sizes.emoji}>{user.avatar}</span>
      <span className={`font-bold ${theme.text} ${sizes.label}`}>
        {user.name}
      </span>
    </button>
  );
}
