'use client';

import React, { useCallback, useEffect } from 'react';

interface NumberKeypadProps {
  value: string;
  onChange: (v: string) => void;
  onSkip: () => void;
  maxLen?: number;
  disabled?: boolean;
}

export default function NumberKeypad({
  value,
  onChange,
  onSkip,
  maxLen = 4,
  disabled = false,
}: NumberKeypadProps): React.JSX.Element {
  const press = useCallback(
    (k: string) => {
      if (disabled) return;
      if (k === 'back') {
        onChange(value.slice(0, -1));
      } else if (k === 'skip') {
        onSkip();
      } else if (value.length < maxLen) {
        onChange(value + k);
      }
    },
    [value, disabled, maxLen, onChange, onSkip]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.key >= '0' && e.key <= '9') press(e.key);
      else if (e.key === 'Backspace') press('back');
      else if (e.key === 'Enter') press('skip');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [press, disabled]);

  const Btn = ({ k, label, className }: { k: string; label?: string; className?: string }) => (
    <button
      type="button"
      onClick={() => press(k)}
      disabled={disabled}
      className={`flex h-12 items-center justify-center rounded-2xl text-xl font-bold transition-colors disabled:opacity-50 sm:h-20 sm:text-3xl ${
        className ??
        'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'
      }`}
    >
      {label ?? k}
    </button>
  );

  return (
    <div className="mx-auto grid w-full max-w-sm grid-cols-3 gap-2 sm:gap-3" data-testid="number-keypad">
      <Btn k="1" />
      <Btn k="2" />
      <Btn k="3" />
      <Btn k="4" />
      <Btn k="5" />
      <Btn k="6" />
      <Btn k="7" />
      <Btn k="8" />
      <Btn k="9" />
      <Btn k="back" label="←" className="bg-amber-200 text-gray-900 hover:bg-amber-300 dark:bg-amber-800 dark:text-gray-100 dark:hover:bg-amber-700" />
      <Btn k="0" />
      <Btn
        k="skip"
        label="スキップ"
        className="bg-gray-400 text-sm text-white hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500 sm:text-lg"
      />
    </div>
  );
}
