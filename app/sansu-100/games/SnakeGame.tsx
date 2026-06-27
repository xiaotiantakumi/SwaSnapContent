'use client';

import React, { useEffect, useRef, useState } from 'react';

import { createSnake, stepSnake, type SnakeState } from '../lib/games/snake';
import {
  clearCanvas,
  dirFromKey,
  drawCell,
  setupCanvas,
  startGameLoop,
  tickIntervalForScore,
  type Dir,
} from '../lib/minigame-core';

const GRID = 15;
const SIZE = 330; // 論理ピクセル（正方）
const CELL = SIZE / GRID;

function draw(ctx: CanvasRenderingContext2D, s: SnakeState): void {
  clearCanvas(ctx, SIZE, '#0f172a');
  // food（りんご）
  drawCell(ctx, s.food.x, s.food.y, CELL, '#ef4444');
  // snake（頭は濃い緑）
  s.snake.forEach((c, i) =>
    drawCell(ctx, c.x, c.y, CELL, i === 0 ? '#16a34a' : '#4ade80')
  );
}

// スネークの Canvas 本体。minigame-core の rAF 固定タイムステップに乗せる。
// 状態は useRef に保持し、表示スコアだけ React state。毎tick setState はしない。
export default function SnakeGame({
  onGameOver,
}: {
  onGameOver: (score: number) => void;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SnakeState>(createSnake(GRID, Math.random));
  const dirRef = useRef<Dir>('right');
  const overRef = useRef(false);
  const [score, setScore] = useState(0);

  const setDir = (d: Dir) => {
    dirRef.current = d;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, SIZE);
    if (!ctx) return;
    stateRef.current = createSnake(GRID, Math.random);
    dirRef.current = 'right';
    overRef.current = false;
    setScore(0);

    const handle = startGameLoop({
      stepMs: () =>
        tickIntervalForScore(stateRef.current.score, {
          baseMs: 200,
          minMs: 90,
          scorePerSpeedup: 4,
          stepDownMs: 12,
        }),
      onTick: () => {
        if (overRef.current) return;
        const next = stepSnake(stateRef.current, dirRef.current, Math.random);
        stateRef.current = next;
        setScore(next.score); // 同値なら React が再描画を省く
        if (next.over) {
          overRef.current = true;
          handle.stop();
          onGameOver(next.score);
        }
      },
      onRender: () => draw(ctx, stateRef.current),
    });

    const onKey = (e: KeyboardEvent) => {
      const d = dirFromKey(e.key);
      if (d) {
        setDir(d);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      handle.stop();
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- マウント時に1ゲームだけ初期化。再戦は親が key を変えて再マウントする
  }, []);

  const padBtn =
    'flex h-12 w-12 items-center justify-center rounded-xl bg-gray-200 text-xl font-bold text-gray-700 active:bg-gray-300 dark:bg-gray-700 dark:text-gray-200';

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
        スコア: <span className="tabular-nums">{score}</span>
      </p>
      <canvas
        ref={canvasRef}
        className="rounded-xl shadow-md"
        style={{ width: SIZE, height: SIZE, touchAction: 'none' }}
      />
      {/* タブレット用 十字コントロール */}
      <div className="grid grid-cols-3 gap-2" aria-label="そうさボタン">
        <span />
        <button type="button" className={padBtn} onClick={() => setDir('up')} aria-label="うえ">
          ▲
        </button>
        <span />
        <button type="button" className={padBtn} onClick={() => setDir('left')} aria-label="ひだり">
          ◀
        </button>
        <button type="button" className={padBtn} onClick={() => setDir('down')} aria-label="した">
          ▼
        </button>
        <button type="button" className={padBtn} onClick={() => setDir('right')} aria-label="みぎ">
          ▶
        </button>
      </div>
    </div>
  );
}
