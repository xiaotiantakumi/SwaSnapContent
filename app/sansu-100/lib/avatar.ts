import type { ThemeColor } from './types';

export const AVATARS: readonly string[] = [
  '🐶', '🐱', '🦊', '🐼', '🦁', '🐯',
  '🐰', '🐻', '🐧', '🐸', '🦄', '🐙',
  '🐳', '🦖', '🐝', '🦋', '🌟', '⚡',
  '🔥', '🍎', '🍓', '🍕', '🎮', '⚽',
];

export const THEME_COLORS: readonly ThemeColor[] = [
  'pink',
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
];

export const THEME_COLOR_CLASSES: Record<
  ThemeColor,
  { bg: string; ring: string; text: string; gradient: string }
> = {
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-900/40',
    ring: 'ring-pink-400',
    text: 'text-pink-700 dark:text-pink-200',
    gradient: 'from-pink-400 to-pink-600',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    ring: 'ring-blue-400',
    text: 'text-blue-700 dark:text-blue-200',
    gradient: 'from-blue-400 to-blue-600',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/40',
    ring: 'ring-green-400',
    text: 'text-green-700 dark:text-green-200',
    gradient: 'from-green-400 to-green-600',
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/40',
    ring: 'ring-yellow-400',
    text: 'text-yellow-700 dark:text-yellow-200',
    gradient: 'from-yellow-400 to-yellow-600',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    ring: 'ring-purple-400',
    text: 'text-purple-700 dark:text-purple-200',
    gradient: 'from-purple-400 to-purple-600',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/40',
    ring: 'ring-orange-400',
    text: 'text-orange-700 dark:text-orange-200',
    gradient: 'from-orange-400 to-orange-600',
  },
};

export function getThemeClasses(color: string) {
  return (
    THEME_COLOR_CLASSES[color as ThemeColor] ?? THEME_COLOR_CLASSES.blue
  );
}
