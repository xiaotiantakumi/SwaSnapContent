'use client';

import React from 'react';

import type { Problem } from '../lib/types';

const OP_SYMBOL: Record<Problem['op'], string> = {
  add: '＋',
  sub: '−',
  mul: '×',
  div: '÷',
};

type Field = 'quotient' | 'remainder';

interface ProblemDisplayProps {
  problem: Problem;
  userInput: string;
  // あまりあり割り算のとき: あまりの入力と、いまどちらのマスを入力中か
  remainderInput?: string;
  activeField?: Field;
  onFocusField?: (field: Field) => void;
  feedback?: 'correct' | 'wrong' | null;
}

export default function ProblemDisplay({
  problem,
  userInput,
  remainderInput = '',
  activeField = 'quotient',
  onFocusField,
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

  const isRemainder = problem.remainder !== undefined;

  // 入力マス。あまりありのときは active なマスをリング表示し、タップで切替できる。
  const Slot = ({
    field,
    value,
  }: {
    field: Field;
    value: string;
  }): React.JSX.Element => {
    const focused = isRemainder && !feedback && activeField === field;
    const ring = focused ? 'ring-2 ring-blue-400 dark:ring-blue-300' : '';
    const cls = `min-w-[1em] rounded-lg border-b-4 px-2 text-center transition-colors duration-150 ${slotBorder} ${slotBg} ${ring}`;
    if (isRemainder && onFocusField) {
      return (
        <button
          type="button"
          onClick={() => onFocusField(field)}
          className={cls}
          data-testid={`answer-slot-${field}`}
        >
          {value || ' '}
        </button>
      );
    }
    return (
      <span className={cls} data-testid={`answer-slot-${field}`}>
        {value || ' '}
      </span>
    );
  };

  // あまりありは横に長くなるので、一行に収まるよう文字を少し小さくする。
  const sizeCls = isRemainder
    ? 'gap-1 text-4xl sm:gap-2 sm:text-6xl md:text-7xl'
    : 'gap-2 text-5xl sm:gap-3 sm:text-7xl md:text-8xl';
  return (
    <div
      className={`flex flex-wrap items-baseline justify-center font-mono font-bold text-gray-900 dark:text-gray-100 ${sizeCls}`}
      data-testid="problem-display"
    >
      <span>{problem.a}</span>
      <span>{OP_SYMBOL[problem.op]}</span>
      <span>{problem.b}</span>
      <span>＝</span>
      <Slot field="quotient" value={userInput} />
      {isRemainder ? (
        <>
          <span className="text-2xl sm:text-4xl md:text-5xl">あまり</span>
          <Slot field="remainder" value={remainderInput} />
        </>
      ) : null}
    </div>
  );
}
