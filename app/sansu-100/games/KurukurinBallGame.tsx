'use client';

import React, { useEffect, useRef, useState } from 'react';

import { mazeTimeLimit, N, E, S, W, type MazeState } from '../lib/games/maze';
import { startGameLoop } from '../lib/minigame-core';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

import { createGS, tick, type GS, BALL_R } from './logic/kurukurin-logic';

// くるりんボール（迷路傾けアクション）
// ボードを傾けるイメージでボールを転がし、ゴールを目指す。壁にぶつかると止まる。
// 既存の迷路生成ロジック（app/sansu-100/lib/games/maze.ts）を流用し、
// プレイヤーはグリッド移動ではなく連続座標＋速度（加速度・摩擦・壁での停止）で動かす。

function draw(ctx: CanvasRenderingContext2D, gs: GS, cell: number): void {
  const m = gs.maze;
  const W0 = m.cols * cell;
  const H0 = m.rows * cell;
  ctx.fillStyle = '#e0e7ff';
  ctx.fillRect(0, 0, W0, H0);

  ctx.fillStyle = '#fde68a';
  ctx.fillRect(m.gx * cell, m.gy * cell, cell, cell);

  ctx.strokeStyle = '#3730a3';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let y = 0; y < m.rows; y++) {
    for (let x = 0; x < m.cols; x++) {
      const c = m.cells[y * m.cols + x];
      const x0 = x * cell;
      const y0 = y * cell;
      if ((c & N) === 0) { ctx.moveTo(x0, y0); ctx.lineTo(x0 + cell, y0); }
      if ((c & W) === 0) { ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + cell); }
      if ((c & E) === 0) { ctx.moveTo(x0 + cell, y0); ctx.lineTo(x0 + cell, y0 + cell); }
      if ((c & S) === 0) { ctx.moveTo(x0, y0 + cell); ctx.lineTo(x0 + cell, y0 + cell); }
    }
  }
  ctx.stroke();

  ctx.font = `${cell * 0.7}px "Apple Color Emoji","Segoe UI Emoji",serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏁', m.gx * cell + cell / 2, m.gy * cell + cell / 2);

  ctx.fillStyle = '#6366f1';
  ctx.beginPath();
  ctx.arc(gs.bx * cell, gs.by * cell, BALL_R * cell, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#312e81';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function computeCell(cols: number, rows: number): number {
  if (typeof window === 'undefined') return 30;
  const byW = (window.innerWidth - 48) / cols;
  const byH = (window.innerHeight - 320) / rows;
  return Math.max(16, Math.min(44, byW, byH));
}

export default function KurukurinBallGame({
  onGameOver,
}: {
  onGameOver: (score: number) => void;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GS>(createGS(Math.random, 1));
  const tiltRef = useRef({ x: 0, y: 0 });
  const cellRef = useRef(30);
  const overRef = useRef(false);
  const soundRef = useRef(true);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(mazeTimeLimit(1));

  const configureCanvas = (m: MazeState) => {
    const cell = computeCell(m.cols, m.rows);
    cellRef.current = cell;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cw = m.cols * cell;
    const ch = m.rows * cell;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  useEffect(() => {
    const rand = Math.random.bind(Math);
    const gs = createGS(rand, 1);
    gsRef.current = gs;
    overRef.current = false;
    soundRef.current = storage.getSettings().soundOn;
    setLevel(1);
    setTimeLeft(mazeTimeLimit(1));
    configureCanvas(gs.maze);

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const handle = startGameLoop({
      stepMs: () => 16,
      onTick: () => {
        if (overRef.current) return;
        tick(gs, tiltRef.current.x, tiltRef.current.y, rand, (ev) => {
          if (ev === 'goal') {
            if (soundRef.current) sound.fanfare();
            setLevel(gs.level);
            setTimeLeft(mazeTimeLimit(gs.level));
            configureCanvas(gs.maze);
          }
          if (ev === 'over' && !overRef.current) {
            overRef.current = true;
            handle.stop();
            if (soundRef.current) sound.crash();
            onGameOver(gs.cleared);
          }
        });
        setTimeLeft(Math.max(0, Math.ceil((gs.timeLimitMs - gs.elapsedMs) / 1000)));
      },
      onRender: () => draw(ctx, gsRef.current, cellRef.current),
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') tiltRef.current.x = -1;
      else if (e.key === 'ArrowRight') tiltRef.current.x = 1;
      else if (e.key === 'ArrowUp') tiltRef.current.y = -1;
      else if (e.key === 'ArrowDown') tiltRef.current.y = 1;
      else return;
      e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && tiltRef.current.x < 0) tiltRef.current.x = 0;
      else if (e.key === 'ArrowRight' && tiltRef.current.x > 0) tiltRef.current.x = 0;
      else if (e.key === 'ArrowUp' && tiltRef.current.y < 0) tiltRef.current.y = 0;
      else if (e.key === 'ArrowDown' && tiltRef.current.y > 0) tiltRef.current.y = 0;
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

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    touchStart.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s0 = touchStart.current;
    if (!s0) return;
    const dx = e.clientX - s0.x;
    const dy = e.clientY - s0.y;
    const mag = Math.hypot(dx, dy);
    if (mag < 8) {
      tiltRef.current = { x: 0, y: 0 };
      return;
    }
    tiltRef.current = { x: dx / mag, y: dy / mag };
  };
  const onPointerUp = () => {
    touchStart.current = null;
    tiltRef.current = { x: 0, y: 0 };
  };

  const setTilt = (x: number, y: number) => { tiltRef.current = { x, y }; };
  const clearTilt = () => { tiltRef.current = { x: 0, y: 0 }; };
  const padBtn = 'flex h-12 w-12 items-center justify-center rounded-xl bg-gray-200 text-xl font-bold text-gray-700 active:bg-gray-300 dark:bg-gray-700 dark:text-gray-200';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-xs items-center justify-between px-1 text-sm font-bold text-gray-800 dark:text-gray-100">
        <span>レベル {level}</span>
        <span className={timeLeft <= 5 ? 'text-red-600' : ''}>⏱ {timeLeft}秒</span>
      </div>
      <canvas
        ref={canvasRef}
        data-testid="kururin-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="rounded-xl shadow-md"
        style={{ touchAction: 'none' }}
      />
      <p className="text-xs text-gray-500 dark:text-gray-400">
        ゆびで かたむける ほうこうへ ドラッグ、ボタンでもOK
      </p>
      <div className="grid grid-cols-3 gap-2" aria-label="かたむけボタン">
        <span />
        <button
          type="button"
          className={padBtn}
          data-testid="kururin-up"
          aria-label="うえ"
          onPointerDown={() => setTilt(0, -1)}
          onPointerUp={clearTilt}
          onPointerLeave={clearTilt}
        >▲</button>
        <span />
        <button
          type="button"
          className={padBtn}
          data-testid="kururin-left"
          aria-label="ひだり"
          onPointerDown={() => setTilt(-1, 0)}
          onPointerUp={clearTilt}
          onPointerLeave={clearTilt}
        >◀</button>
        <span />
        <button
          type="button"
          className={padBtn}
          data-testid="kururin-right"
          aria-label="みぎ"
          onPointerDown={() => setTilt(1, 0)}
          onPointerUp={clearTilt}
          onPointerLeave={clearTilt}
        >▶</button>
        <span />
        <button
          type="button"
          className={padBtn}
          data-testid="kururin-down"
          aria-label="した"
          onPointerDown={() => setTilt(0, 1)}
          onPointerUp={clearTilt}
          onPointerLeave={clearTilt}
        >▼</button>
        <span />
      </div>
    </div>
  );
}
