'use client';

import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  correctCount?: number;
}

export default function ProgressBar({
  current,
  total,
  correctCount,
}: ProgressBarProps): React.JSX.Element {
  const pct = Math.min(100, (current / total) * 100);
  return (
    <div className="space-y-1" data-testid="progress-bar">
      <div className="flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-300">
        <span>
          {current} / {total}
        </span>
        {correctCount !== undefined && (
          <span className="text-green-600 dark:text-green-400">
            ⭕️ {correctCount}
          </span>
        )}
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
