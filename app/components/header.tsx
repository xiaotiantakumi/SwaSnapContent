import React from 'react';

import Link from 'next/link';

interface HeaderProps {
  title?: string;
  description?: string;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  // 指定すると戻るは Link ではなくこのハンドラを呼ぶ（未保存確認などに使う）
  onBackClick?: () => void;
}

export default function Header({
  title,
  description,
  showBackButton = false,
  backHref = '/',
  backLabel,
  onBackClick,
}: HeaderProps = {}): React.JSX.Element {
  const label = backLabel ?? (backHref === '/' ? 'アプリ選択に戻る' : 'もどる');
  const backClass =
    'inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300';
  return (
    <header className="w-full max-w-3xl">
      {showBackButton ? (
        <div className="mb-4">
          {onBackClick ? (
            <button
              type="button"
              onClick={onBackClick}
              className={backClass}
              data-testid="back-to-home"
            >
              ← {label}
            </button>
          ) : (
            <Link href={backHref} className={backClass} data-testid="back-to-home">
              ← {label}
            </Link>
          )}
        </div>
      ) : null}
      
      {title ? (
        <h1 className="mb-2 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
      ) : null}
      {description ? (
        <p className="text-center text-gray-600 dark:text-gray-400">
          {description}
        </p>
      ) : null}
    </header>
  );
}
