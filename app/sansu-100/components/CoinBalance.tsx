import React from 'react';

// コイン残高の表示。🪙アイコン＋数値で、文字が読めない子でも分かるようにする。
export default function CoinBalance({
  coins,
  size = 'md',
  className = '',
}: {
  coins: number | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}): React.JSX.Element {
  const value = coins ?? 0;
  const sizeClass =
    size === 'lg'
      ? 'text-2xl px-4 py-2'
      : size === 'sm'
        ? 'text-sm px-2 py-0.5'
        : 'text-base px-3 py-1';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-yellow-100 font-bold text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 ${sizeClass} ${className}`}
      aria-label={`コイン ${value}まい`}
      title={`コイン ${value}`}
    >
      <span aria-hidden>🪙</span>
      <span className="tabular-nums">{value}</span>
    </span>
  );
}
