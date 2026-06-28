'use client';

import React, { useEffect, useRef, useState } from 'react';

import {
  createFlappy,
  FLAPPY,
  stepFlappy,
  type FlappyState,
} from '../lib/games/flappy';
import { isActionKey, startGameLoop } from '../lib/minigame-core';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

function computeWidth(): number {
  if (typeof window === 'undefined') return 240;
  return Math.max(200, Math.min(300, window.innerWidth - 48));
}

function draw(
  ctx: CanvasRenderingContext2D,
  s: FlappyState,
  scale: number,
  avatar: string
): void {
  const W = FLAPPY.w * scale;
  const H = FLAPPY.h * scale;
  ctx.fillStyle = '#bae6fd';
  ctx.fillRect(0, 0, W, H);
  // パイプ
  ctx.fillStyle = '#16a34a';
  for (const p of s.pipes) {
    const x = p.x * scale;
    const w = FLAPPY.pipeW * scale;
    ctx.fillRect(x, 0, w, p.gapY * scale); // 上
    const by2 = (p.gapY + FLAPPY.gapH) * scale;
    ctx.fillRect(x, by2, w, H - by2); // 下
  }
  // 鳥（アバター）
  ctx.font = `${FLAPPY.birdR * 2.4 * scale}px "Apple Color Emoji","Segoe UI Emoji",serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(avatar, FLAPPY.birdX * scale, s.by * scale);
}

// ぱたぱた。タップ/スペースで上昇、すき間をくぐる。
export default function FlappyGame({
  onGameOver,
  avatar = '🐤',
}: {
  onGameOver: (score: number) => void;
  avatar?: string;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<FlappyState>(createFlappy(Math.random));
  const flapRef = useRef(false);
  const scaleRef = useRef(1);
  const overRef = useRef(false);
  const soundRef = useRef(true);
  const [score, setScore] = useState(0);

  const flap = () => {
    flapRef.current = true;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cw = computeWidth();
    const scale = cw / FLAPPY.w;
    scaleRef.current = scale;
    const ch = FLAPPY.h * scale;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    stateRef.current = createFlappy(Math.random);
    flapRef.current = false;
    overRef.current = false;
    soundRef.current = storage.getSettings().soundOn;
    setScore(0);

    const handle = startGameLoop({
      stepMs: () => 24,
      onTick: () => {
        if (overRef.current) return;
        const prevScore = stateRef.current.score;
        const next = stepFlappy(stateRef.current, flapRef.current, Math.random);
        if (flapRef.current && soundRef.current) sound.eat();
        flapRef.current = false;
        stateRef.current = next;
        if (next.score !== prevScore) setScore(next.score);
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
      if (isActionKey(e.key)) {
        flap();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      handle.stop();
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- マウント時に1ゲーム。再戦は親が key で再マウント
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
        スコア: <span className="tabular-nums">{score}</span>
      </p>
      <canvas
        ref={canvasRef}
        onPointerDown={flap}
        className="rounded-xl shadow-md"
        style={{ touchAction: 'none' }}
      />
      <button
        type="button"
        onClick={flap}
        className="w-full max-w-xs rounded-xl bg-purple-500 py-4 text-lg font-bold text-white active:bg-purple-600"
        aria-label="ぱたぱた"
      >
        🐤 ぱたぱた（タップ）
      </button>
    </div>
  );
}
