'use client';

import React, { useCallback, useEffect } from 'react';

interface PinPadProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit?: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
}

export default function PinPad({
  value,
  onChange,
  onSubmit,
  error,
  disabled = false,
}: PinPadProps): React.JSX.Element {
  const press = useCallback(
    (digit: string) => {
      if (disabled) return;
      if (digit === 'back') {
        onChange(value.slice(0, -1));
        return;
      }
      if (value.length >= 4) return;
      const next = value + digit;
      onChange(next);
      if (next.length === 4 && onSubmit) {
        // tiny delay so the user sees the 4th dot before submitting
        setTimeout(() => onSubmit(next), 80);
      }
    },
    [value, disabled, onChange, onSubmit]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.key >= '0' && e.key <= '9') press(e.key);
      else if (e.key === 'Backspace') press('back');
      else if (e.key === 'Enter' && value.length === 4 && onSubmit) onSubmit(value);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [press, value.length, onSubmit, disabled]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3" role="status" aria-label="PIN入力">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`size-6 rounded-full border-2 ${
              i < value.length
                ? 'border-blue-600 bg-blue-600'
                : 'border-gray-400 bg-transparent'
            }`}
          />
        ))}
      </div>
      {error ? (
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
      <div className="grid grid-cols-3 gap-3" data-testid="pin-pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            type="button"
            disabled={disabled}
            onClick={() => press(d)}
            className="flex size-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl font-bold text-gray-900 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled || value.length === 0}
          onClick={() => press('back')}
          className="flex size-16 items-center justify-center rounded-2xl bg-gray-100 text-xl text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-30 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          aria-label="削除"
        >
          ←
        </button>
        <button
          key="0"
          type="button"
          disabled={disabled}
          onClick={() => press('0')}
          className="flex size-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl font-bold text-gray-900 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
        >
          0
        </button>
        <div className="size-16" />
      </div>
    </div>
  );
}
