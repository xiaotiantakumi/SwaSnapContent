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

// 神経衰弱。turn-based なので rAF 不要・React state で駆動。不一致は少し見せてから裏返す。
export default function MemoryGame({
  onGameOver,
}: {
  onGameOver: (score: number) => void;
}): React.JSX.Element {
  const [state, setState] = useState<MemoryState>(() =>
    createMemory(Math.random)
  );
  const overFired = useRef(false);
  const soundRef = useRef(true);

  useEffect(() => {
    soundRef.current = storage.getSettings().soundOn;
  }, []);

  // 不一致表示中は少し待って裏返す
  useEffect(() => {
    if (!state.busy) return;
    const t = setTimeout(() => setState((s) => resolveMemory(s)), 850);
    return () => clearTimeout(t);
  }, [state.busy]);

  // クリア検知
  useEffect(() => {
    if (state.over && !overFired.current) {
      overFired.current = true;
      if (soundRef.current) sound.fanfare();
      const score = Math.max(1, 40 - state.moves * 2);
      onGameOver(score);
    }
  }, [state.over, state.moves, onGameOver]);

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
        そろった: {state.pairs} / 6 ・ めくり: {state.moves}
      </p>
      <div className="grid grid-cols-3 gap-3">
        {state.cards.map((c, i) => {
          const face = c.revealed || c.matched;
          return (
            <button
              key={i}
              type="button"
              disabled={state.busy || face}
              onClick={() => pick(i)}
              className={`flex size-20 items-center justify-center rounded-2xl text-4xl shadow transition-transform active:scale-95 ${
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
