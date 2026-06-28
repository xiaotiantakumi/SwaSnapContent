'use client';

import React, { useEffect, useRef, useState } from 'react';

import {
  createWhack,
  hitHole,
  stepWhack,
  WHACK,
  type WhackState,
} from '../lib/games/whack';
import { startGameLoop } from '../lib/minigame-core';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

// もぐらたたき。3x3 の穴をタップ。描画は DOM（タップ的が大きくモバイル向き）。
// ゲーム進行は minigame-core の rAF tick で driven（setInterval 不使用）。
export default function WhackGame({
  onGameOver,
}: {
  onGameOver: (score: number) => void;
}): React.JSX.Element {
  const [state, setState] = useState<WhackState>(createWhack);
  const stateRef = useRef<WhackState>(state);
  const overRef = useRef(false);
  const soundRef = useRef(true);
  // 叩いた手応えの一瞬の演出
  const [flash, setFlash] = useState<{ i: number; bad: boolean } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fresh = createWhack();
    stateRef.current = fresh;
    setState(fresh);
    overRef.current = false;
    soundRef.current = storage.getSettings().soundOn;

    const handle = startGameLoop({
      stepMs: () => 110,
      onTick: () => {
        if (overRef.current) return;
        const next = stepWhack(stateRef.current, Math.random);
        stateRef.current = next;
        setState(next);
        if (next.over) {
          overRef.current = true;
          handle.stop();
          onGameOver(next.score);
        }
      },
      onRender: () => {
        /* DOM は React state で描画 */
      },
    });
    return () => handle.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- マウント時に1ゲーム。再戦は親が key で再マウント
  }, []);

  const hit = (i: number) => {
    if (overRef.current) return;
    const mole = stateRef.current.holes[i];
    const next = hitHole(stateRef.current, i);
    stateRef.current = next;
    setState(next);
    if (mole?.active) {
      if (soundRef.current) {
        if (mole.isBad) sound.wrong();
        else sound.eat();
      }
      setFlash({ i, bad: mole.isBad });
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlash(null), 280);
    }
  };

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  const timePct = Math.max(
    0,
    Math.round((state.ticksLeft / WHACK.totalTicks) * 100)
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
        スコア: <span className="tabular-nums">{state.score}</span>
      </p>
      {/* のこり時間バー（残り少なくなると赤） */}
      <div className="h-4 w-full max-w-xs overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full transition-[width] duration-100 ${
            timePct <= 25 ? 'bg-red-500' : 'bg-green-500'
          }`}
          style={{ width: `${timePct}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {state.holes.map((m, i) => (
          <button
            key={i}
            type="button"
            onPointerDown={() => hit(i)}
            className="flex size-20 items-center justify-center rounded-2xl bg-amber-800/80 text-4xl shadow-inner active:scale-95"
            aria-label={`あな${i + 1}`}
            data-testid={`whack-hole-${i}`}
            data-active={m.active ? (m.isBad ? 'bad' : 'mole') : 'none'}
          >
            {flash?.i === i
              ? flash.bad
                ? '💢'
                : '💥'
              : m.active
                ? m.isBad
                  ? '💣'
                  : '🐹'
                : '🕳️'}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        🐹を タップ！💣は たたかないでね
      </p>
    </div>
  );
}
