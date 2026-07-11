'use client';

import React, { useEffect, useRef, useState } from 'react';

import { startGameLoop } from '../lib/minigame-core';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

import {
  createGS,
  tick,
  type GS,
  W,
  H,
  PADDLE_W,
  PADDLE_H,
  PLAYER_Y,
  CPU_Y,
  PUCK_R,
  GAME_DURATION_MS,
} from './logic/airhockey-logic';

// はじいてホッケー（エアホッケー風の反射ゲーム）
// 下のマレット（自分）を左右に動かしてパックを打ち返し、上の相手ゴールに入れる。
// 相手（CPU）は自動でパックを追いかける。制限時間30秒、または5点差をつけられると終了。

function draw(ctx: CanvasRenderingContext2D, gs: GS, scale: number): void {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W * scale, H * scale);

  // センターライン
  ctx.strokeStyle = 'rgba(148,163,184,0.3)';
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(0, (H / 2) * scale);
  ctx.lineTo(W * scale, (H / 2) * scale);
  ctx.stroke();
  ctx.setLineDash([]);

  // CPUマレット
  ctx.fillStyle = '#f87171';
  ctx.fillRect(gs.cpuX * scale, CPU_Y * scale, PADDLE_W * scale, PADDLE_H * scale);

  // プレイヤーマレット
  ctx.fillStyle = '#60a5fa';
  ctx.fillRect(gs.playerX * scale, PLAYER_Y * scale, PADDLE_W * scale, PADDLE_H * scale);

  // パック
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(gs.puckX * scale, gs.puckY * scale, PUCK_R * scale, 0, Math.PI * 2);
  ctx.fill();
}

function computeWidth(): number {
  if (typeof window === 'undefined') return W;
  return Math.max(220, Math.min(320, window.innerWidth - 48));
}

export default function AirHockeyGame({
  onGameOver,
}: {
  onGameOver: (score: number) => void;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GS>(createGS(Math.random));
  const moveRef = useRef(0);
  const scaleRef = useRef(1);
  const overRef = useRef(false);
  const soundRef = useRef(true);
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(Math.ceil(GAME_DURATION_MS / 1000));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cw = computeWidth();
    const scale = cw / W;
    scaleRef.current = scale;
    const ch = H * scale;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const rand = Math.random.bind(Math);
    gsRef.current = createGS(rand);
    overRef.current = false;
    moveRef.current = 0;
    soundRef.current = storage.getSettings().soundOn;
    setPlayerScore(0);
    setCpuScore(0);
    setTimeLeft(Math.ceil(GAME_DURATION_MS / 1000));

    const handle = startGameLoop({
      stepMs: () => 16,
      onTick: () => {
        if (overRef.current) return;
        const gs = gsRef.current;
        tick(gs, 16, moveRef.current, rand, (ev) => {
          if (ev === 'hit' && soundRef.current) sound.correct();
          if (ev === 'score') {
            setPlayerScore(gs.playerScore);
            setCpuScore(gs.cpuScore);
            if (soundRef.current) sound.eat();
          }
          if (ev === 'over' && !overRef.current) {
            overRef.current = true;
            handle.stop();
            if (soundRef.current) sound.fanfare();
            onGameOver(gs.playerScore);
          }
        });
        setTimeLeft(
          Math.max(0, Math.ceil((GAME_DURATION_MS - gs.elapsedMs) / 1000))
        );
      },
      onRender: () => draw(ctx, gsRef.current, scaleRef.current),
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
    gsRef.current.playerX = Math.max(
      0,
      Math.min(W - PADDLE_W, logicalX - PADDLE_W / 2)
    );
  };

  const btn =
    'flex h-14 flex-1 items-center justify-center rounded-xl bg-gray-200 text-2xl font-bold text-gray-700 active:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 select-none';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-xs items-center justify-between px-1 text-sm font-bold text-gray-800 dark:text-gray-100">
        <span data-testid="airhockey-score">
          きみ <span className="tabular-nums">{playerScore}</span> - <span className="tabular-nums">{cpuScore}</span> あいて
        </span>
        <span className={timeLeft <= 5 ? 'text-red-600' : ''}>⏱ {timeLeft}秒</span>
      </div>
      <canvas
        ref={canvasRef}
        data-testid="airhockey-canvas"
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
          data-testid="airhockey-left"
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
          data-testid="airhockey-right"
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
