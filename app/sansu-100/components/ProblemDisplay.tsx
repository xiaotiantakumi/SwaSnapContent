'use client';

import React from 'react';

import type { Problem } from '../lib/types';

const OP_SYMBOL: Record<Problem['op'], string> = {
  add: '＋',
  sub: '−',
  mul: '×',
  div: '÷',
};

interface ProblemDisplayProps {
  problem: Problem;
  userInput: string;
  feedback?: 'correct' | 'wrong' | null;
}

export default function ProblemDisplay({
  problem,
  userInput,
  feedback,
}: ProblemDisplayProps): React.JSX.Element {
  // Keep the problem text in a stable color regardless of feedback so the page
  // doesn't appear to "flash to light mode" on each correct answer. Only the
  // answer slot reacts.
  const slotBg =
    feedback === 'correct'
      ? 'bg-green-500/20 dark:bg-green-400/25'
      : feedback === 'wrong'
        ? 'bg-red-500/20 dark:bg-red-400/25'
        : 'bg-transparent';
  const slotBorder =
    feedback === 'correct'
      ? 'border-green-600 dark:border-green-400'
      : feedback === 'wrong'
        ? 'border-red-600 dark:border-red-400'
        : 'border-gray-400 dark:border-gray-500';
  return (
    <div
      className="flex items-baseline justify-center gap-3 font-mono text-6xl font-bold text-gray-900 dark:text-gray-100 sm:text-7xl md:text-8xl"
      data-testid="problem-display"
    >
      <span>{problem.a}</span>
      <span>{OP_SYMBOL[problem.op]}</span>
      <span>{problem.b}</span>
      <span>＝</span>
      <span
        className={`min-w-[1.5em] rounded-lg border-b-4 px-2 text-center transition-colors duration-150 ${slotBorder} ${slotBg}`}
      >
        {userInput || ' '}
      </span>
    </div>
  );
}
