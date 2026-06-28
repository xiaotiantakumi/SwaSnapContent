'use client';

import React, { useEffect, useRef, useState } from 'react';

import {
  createFalling,
  FALLING,
  stepFalling,
  type FallingState,
} from '../lib/games/falling';
import { startGameLoop } from '../lib/minigame-core';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

function computeWidth(): number {
  if (typeof window === 'undefined') return 260;
  return Math.max(220, Math.min(320, window.innerWidth - 48));
}

function emoji(
  ctx: CanvasRenderingContext2D,
  ch: string,
  cx: number,
  cy: number,
  size: number
): void {
  ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji",serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ch, cx, cy);
}

function draw(
  ctx: CanvasRenderingContext2D,
  s: FallingState,
  scale: number,
  avatar: string
): void {
  const W = FALLING.w * scale;
  const H = FALLING.h * scale;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W, H);
  // 落ちもの（おばけ）
  for (const it of s.items) {
    emoji(ctx, '👻', it.x * scale, it.y * scale, FALLING.itemR * 2.4 * scale);
  }
  // プレイヤー（アバター）
  emoji(
    ctx,
    avatar,
    (s.playerX + FALLING.playerW / 2) * scale,
    (FALLING.playerY + FALLING.playerH / 2) * scale,
    FALLING.playerW * scale * 1.1
  );
}

// おちものよけ。プレイヤー(固定キャラ)を左右に動かして いわ をよける。
export default function FallingGame({
  onGameOver,
  avatar = '🐱',
}: {
  onGameOver: (score: number) => void;
  avatar?: string;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<FallingState>(createFalling(Math.random));
  const playerXRef = useRef(stateRef.current.playerX);
  const moveRef = useRef(0);
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
    const scale = cw / FALLING.w;
    scaleRef.current = scale;
    const ch = FALLING.h * scale;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const fresh = createFalling(Math.random);
    stateRef.current = fresh;
    playerXRef.current = fresh.playerX;
    moveRef.current = 0;
    overRef.current = false;
    soundRef.current = storage.getSettings().soundOn;
    setScore(0);

    const handle = startGameLoop({
      stepMs: () => 24,
      onTick: () => {
        if (overRef.current) return;
        playerXRef.current += moveRef.current * 6;
        const next = stepFalling(stateRef.current, playerXRef.current, Math.random);
        playerXRef.current = next.playerX;
        stateRef.current = next;
        setScore(next.score);
        if (next.over) {
          overRef.current = true;
          handle.stop();
          if (soundRef.current) sound.crash();
          onGameOver(next.score);
        }
      },
      onRender: () => draw(ctx, stateRef.current, scaleRef.current, avatar),
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

  const onMove = (e: React.PointerEvent) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const logicalX = (e.clientX - rect.left) / scaleRef.current;
    playerXRef.current = logicalX - FALLING.playerW / 2;
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
        className="rounded-xl shadow-md"
        style={{ touchAction: 'none' }}
      />
      <p className="text-xs text-gray-500 dark:text-gray-400">
        ゆびで うごかして 👻を よけよう
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
