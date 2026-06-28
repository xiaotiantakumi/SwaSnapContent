'use client';

import React, { useEffect, useRef, useState } from 'react';

import {
  createMemory,
  pickCard,
  resolveMemory,
  type MemoryState,
} from '../lib/games/memory';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

const CARD_EMOJI = ['🐶', '🐱', '🦊', '🐼', '🦁', '🐰', '🐸', '🐧'];

// 神経衰弱。1ボードそろえるたびに もっとカードが増える（レベルアップ）。
// 終わりは「やめる」で、そろえたボード数がスコア。onScore で親に報告。
export default function MemoryGame({
  onScore,
}: {
  onScore: (boardsCleared: number) => void;
}): React.JSX.Element {
  const [state, setState] = useState<MemoryState>(() =>
    createMemory(Math.random, 1)
  );
  const [level, setLevel] = useState(1);
  const levelRef = useRef(1);
  const soundRef = useRef(true);

  useEffect(() => {
    soundRef.current = storage.getSettings().soundOn;
    levelRef.current = 1;
    setLevel(1);
    setState(createMemory(Math.random, 1));
    onScore(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- マウント時に1回
  }, []);

  // 不一致表示中は少し待って裏返す
  useEffect(() => {
    if (!state.busy) return;
    const t = setTimeout(() => setState((s) => resolveMemory(s)), 850);
    return () => clearTimeout(t);
  }, [state.busy]);

  // 1ボード クリア → 次のレベル（カードが増える）
  useEffect(() => {
    if (!state.cleared) return;
    if (soundRef.current) sound.fanfare();
    const cleared = levelRef.current; // このボード= levelRef 枚目
    onScore(cleared);
    const t = setTimeout(() => {
      const next = levelRef.current + 1;
      levelRef.current = next;
      setLevel(next);
      setState(createMemory(Math.random, next));
    }, 950);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleared をトリガに進める
  }, [state.cleared]);

  const pick = (i: number) => {
    setState((s) => {
      const before = s.pairs;
      const next = pickCard(s, i);
      if (next.pairs > before && soundRef.current) sound.correct();
      return next;
    });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
        レベル {level} ・ そろった {state.pairs}/{state.boardPairs}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {state.cards.map((c, i) => {
          const face = c.revealed || c.matched;
          return (
            <button
              key={i}
              type="button"
              disabled={state.busy || face}
              onClick={() => pick(i)}
              className={`flex size-16 items-center justify-center rounded-2xl text-3xl shadow transition-transform active:scale-95 ${
                c.matched
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : face
                    ? 'bg-white dark:bg-gray-700'
                    : 'bg-gradient-to-br from-indigo-400 to-purple-500'
              }`}
              aria-label={face ? `カード${CARD_EMOJI[c.value]}` : 'うらむきカード'}
              data-testid={`memory-card-${i}`}
              data-value={c.value}
              data-face={face ? 'up' : 'down'}
            >
              {face ? CARD_EMOJI[c.value] : '🎁'}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        おなじ えを 2まい さがそう！
      </p>
    </div>
  );
}
