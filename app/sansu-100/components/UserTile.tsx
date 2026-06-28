'use client';

import React from 'react';

import { getThemeClasses } from '../lib/avatar';
import type { SansuUserPublic } from '../lib/types';

import AvatarDisplay from './AvatarDisplay';

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
    sm: { wrap: 'p-3', label: 'text-sm' },
    md: { wrap: 'p-5', label: 'text-lg' },
    lg: { wrap: 'p-7', label: 'text-xl' },
  }[size];

  return (
    <button
      type="button"
      onClick={() => onSelect(user)}
      className={`flex flex-col items-center gap-2 rounded-2xl ${theme.bg} ${sizes.wrap} hover: ring-4 ring-transparent transition-all hover:scale-105${theme.ring} hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-offset-gray-900`}
      data-testid={`user-tile-${user.id}`}
    >
      <AvatarDisplay user={user} size={size} />
      <span className={`font-bold ${theme.text} ${sizes.label}`}>
        {user.name}
      </span>
    </button>
  );
}
