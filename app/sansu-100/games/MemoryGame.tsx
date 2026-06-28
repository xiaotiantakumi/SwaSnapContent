'use client';

import React, { useEffect, useRef, useState } from 'react';

import {
  createMemory,
  memoryTimeLimit,
  pickCard,
  resolveMemory,
  type MemoryState,
} from '../lib/games/memory';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

const CARD_EMOJI = ['🐶', '🐱', '🦊', '🐼', '🦁', '🐰', '🐸', '🐧'];

// 神経衰弱。レベルごとの制限時間内にそろえるとレベルアップ（カードが増える）。
// 時間切れ or「やめる」で終了。スコア=そろえたボード数。onScore=途中経過, onGameOver=時間切れ。
export default function MemoryGame({
  onScore,
  onGameOver,
}: {
  onScore: (boardsCleared: number) => void;
  onGameOver: (boardsCleared: number) => void;
}): React.JSX.Element {
  const [state, setState] = useState<MemoryState>(() =>
    createMemory(Math.random, 1)
  );
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(() => memoryTimeLimit(1));
  const timeLeftRef = useRef(memoryTimeLimit(1));
  const levelRef = useRef(1);
  const clearedRef = useRef(0); // そろえたボード数
  const overRef = useRef(false);
  const soundRef = useRef(true);

  useEffect(() => {
    soundRef.current = storage.getSettings().soundOn;
    levelRef.current = 1;
    clearedRef.current = 0;
    overRef.current = false;
    setLevel(1);
    setState(createMemory(Math.random, 1));
    onScore(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- マウント時に1回
  }, []);

  // レベルが変わるたびに制限時間をリセットしてカウントダウン開始。0で時間切れ＝終了。
  useEffect(() => {
    if (overRef.current) return;
    const limit = memoryTimeLimit(level);
    timeLeftRef.current = limit;
    setTimeLeft(limit);
    const id = setInterval(() => {
      const t = timeLeftRef.current - 1;
      timeLeftRef.current = t;
      setTimeLeft(Math.max(0, t));
      if (t <= 0) {
        clearInterval(id);
        if (!overRef.current) {
          overRef.current = true;
          if (soundRef.current) sound.crash();
          onGameOver(clearedRef.current); // setState更新関数の外で呼ぶ
        }
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- level 変化で時計を作り直す
  }, [level]);

  // 不一致表示中は少し待って裏返す
  useEffect(() => {
    if (!state.busy) return;
    const t = setTimeout(() => setState((s) => resolveMemory(s)), 850);
    return () => clearTimeout(t);
  }, [state.busy]);

  // 1ボード クリア → 次のレベル（カードが増える・制限時間リセット）
  useEffect(() => {
    if (!state.cleared || overRef.current) return;
    if (soundRef.current) sound.fanfare();
    clearedRef.current = levelRef.current; // このボードまでクリア
    onScore(clearedRef.current);
    const t = setTimeout(() => {
      if (overRef.current) return;
      const next = levelRef.current + 1;
      levelRef.current = next;
      setLevel(next);
      setState(createMemory(Math.random, next));
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleared をトリガに進める
  }, [state.cleared]);

  const pick = (i: number) => {
    if (overRef.current) return;
    setState((s) => {
      const before = s.pairs;
      const next = pickCard(s, i);
      if (next.pairs > before && soundRef.current) sound.correct();
      return next;
    });
  };

  const limit = memoryTimeLimit(level);
  const pct = Math.max(0, Math.min(100, (timeLeft / limit) * 100));
  const low = timeLeft <= 5;

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
        レベル {level} ・ そろった {state.pairs}/{state.boardPairs}
      </p>
      <div className="w-full max-w-xs">
        <div className="mb-1 flex justify-between text-sm font-bold">
          <span className={low ? 'text-red-600' : 'text-gray-700 dark:text-gray-200'}>
            ⏱ のこり {timeLeft}秒
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${
              low ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
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
        じかんない に おなじ えを 2まい さがそう！
      </p>
    </div>
  );
}
