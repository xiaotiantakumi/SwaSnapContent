'use client';

import React, { useEffect, useRef, useState } from 'react';

import {
  BREAKOUT,
  BRICK_W,
  createBreakout,
  stepBreakout,
  type BreakoutState,
} from '../lib/games/breakout';
import { startGameLoop } from '../lib/minigame-core';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

const BRICK_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

function computeWidth(): number {
  if (typeof window === 'undefined') return 260;
  return Math.max(220, Math.min(320, window.innerWidth - 48));
}

function draw(
  ctx: CanvasRenderingContext2D,
  s: BreakoutState,
  scale: number
): void {
  const W = BREAKOUT.w * scale;
  const H = BREAKOUT.h * scale;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W, H);
  // ブロック
  for (let row = 0; row < BREAKOUT.rows; row++) {
    for (let col = 0; col < BREAKOUT.cols; col++) {
      if (!s.bricks[row * BREAKOUT.cols + col]) continue;
      const x = col * BRICK_W * scale;
      const y = (BREAKOUT.brickTop + row * BREAKOUT.brickH) * scale;
      ctx.fillStyle = BRICK_COLORS[row % BRICK_COLORS.length];
      ctx.fillRect(
        x + 1,
        y + 1,
        BRICK_W * scale - 2,
        BREAKOUT.brickH * scale - 2
      );
    }
  }
  // パドル
  ctx.fillStyle = '#60a5fa';
  ctx.fillRect(
    s.paddleX * scale,
    BREAKOUT.paddleY * scale,
    BREAKOUT.paddleW * scale,
    BREAKOUT.paddleH * scale
  );
  // ボール
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(s.bx * scale, s.by * scale, BREAKOUT.ballR * scale, 0, Math.PI * 2);
  ctx.fill();
}

// ブロック崩し。パドルはドラッグ／左右ボタン／矢印で操作。
export default function BreakoutGame({
  onGameOver,
}: {
  onGameOver: (score: number, won: boolean) => void;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<BreakoutState>(createBreakout());
  const paddleXRef = useRef(stateRef.current.paddleX);
  const moveRef = useRef(0); // -1 / 0 / 1（ボタン・キー用）
  const scaleRef = useRef(1);
  const overRef = useRef(false);
  const soundRef = useRef(true);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cw = computeWidth();
    const scale = cw / BREAKOUT.w;
    scaleRef.current = scale;
    const ch = BREAKOUT.h * scale;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const fresh = createBreakout();
    stateRef.current = fresh;
    paddleXRef.current = fresh.paddleX;
    moveRef.current = 0;
    overRef.current = false;
    soundRef.current = storage.getSettings().soundOn;
    setScore(0);

    const handle = startGameLoop({
      stepMs: () => 16,
      onTick: () => {
        if (overRef.current) return;
        // ボタン/キー移動
        paddleXRef.current += moveRef.current * 5;
        const prevScore = stateRef.current.score;
        const next = stepBreakout(stateRef.current, paddleXRef.current);
        paddleXRef.current = next.paddleX;
        stateRef.current = next;
        if (next.score > prevScore) {
          setScore(next.score);
          if (soundRef.current) sound.eat();
        }
        if (next.over) {
          overRef.current = true;
          handle.stop();
          if (soundRef.current) sound.crash();
          onGameOver(next.score, next.won);
        }
      },
      onRender: () => draw(ctx, stateRef.current, scaleRef.current),
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') moveRef.current = -1;
      else if (e.key === 'ArrowRight') moveRef.current = 1;
    };
    const onKeyUp = () => {
      moveRef.current = 0;
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      handle.stop();
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- マウント時に1ゲーム。再戦は親が key で再マウント
  }, []);

  // ドラッグでパドルを指に追従
  const onMove = (e: React.PointerEvent) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const logicalX = (e.clientX - rect.left) / scaleRef.current;
    paddleXRef.current = logicalX - BREAKOUT.paddleW / 2;
  };

  const btn =
    'flex h-14 flex-1 items-center justify-center rounded-xl bg-gray-200 text-2xl font-bold text-gray-700 active:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 select-none';

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
        スコア: <span className="tabular-nums">{score}</span>
      </p>
      <canvas
        ref={canvasRef}
        onPointerDown={onMove}
        onPointerMove={onMove}
        className="touch-none rounded-xl shadow-md"
        style={{ touchAction: 'none' }}
      />
      <p className="text-xs text-gray-500 dark:text-gray-400">
        ゆびで うごかす、ボタンでもOK
      </p>
      <div className="flex w-full max-w-xs gap-3">
        <button
          type="button"
          className={btn}
          aria-label="ひだり"
          onPointerDown={() => (moveRef.current = -1)}
          onPointerUp={() => (moveRef.current = 0)}
          onPointerLeave={() => (moveRef.current = 0)}
        >
          ◀
        </button>
        <button
          type="button"
          className={btn}
          aria-label="みぎ"
          onPointerDown={() => (moveRef.current = 1)}
          onPointerUp={() => (moveRef.current = 0)}
          onPointerLeave={() => (moveRef.current = 0)}
        >
          ▶
        </button>
      </div>
    </div>
  );
}
