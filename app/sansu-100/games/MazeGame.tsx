'use client';

import React, { useEffect, useRef, useState } from 'react';

import { createMaze, moveMaze, N, E, S, W, type MazeState } from '../lib/games/maze';
import { dirFromKey, type Dir } from '../lib/minigame-core';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

function computeCell(cols: number, rows: number): number {
  if (typeof window === 'undefined') return 30;
  const byW = (window.innerWidth - 48) / cols;
  const byH = (window.innerHeight - 320) / rows;
  return Math.max(16, Math.min(44, byW, byH));
}

function draw(
  ctx: CanvasRenderingContext2D,
  s: MazeState,
  cell: number,
  avatar: string
): void {
  const W0 = s.cols * cell;
  const H0 = s.rows * cell;
  ctx.fillStyle = '#dcfce7';
  ctx.fillRect(0, 0, W0, H0);
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(s.gx * cell, s.gy * cell, cell, cell);
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let y = 0; y < s.rows; y++) {
    for (let x = 0; x < s.cols; x++) {
      const m = s.cells[y * s.cols + x];
      const x0 = x * cell;
      const y0 = y * cell;
      if ((m & N) === 0) {
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + cell, y0);
      }
      if ((m & W) === 0) {
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0, y0 + cell);
      }
      if ((m & E) === 0) {
        ctx.moveTo(x0 + cell, y0);
        ctx.lineTo(x0 + cell, y0 + cell);
      }
      if ((m & S) === 0) {
        ctx.moveTo(x0, y0 + cell);
        ctx.lineTo(x0 + cell, y0 + cell);
      }
    }
  }
  ctx.stroke();
  ctx.font = `${cell * 0.7}px "Apple Color Emoji","Segoe UI Emoji",serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏁', s.gx * cell + cell / 2, s.gy * cell + cell / 2);
  ctx.font = `${cell * 0.8}px "Apple Color Emoji","Segoe UI Emoji",serif`;
  ctx.fillText(avatar, s.px * cell + cell / 2, s.py * cell + cell / 2);
}

// めいろ。ゴールに着くたびに もっと大きい迷路に（レベルアップ）。
// 終わりは「やめる」で、それまでにクリアした数がスコア。
export default function MazeGame({
  onScore,
  avatar = '🐰',
}: {
  onScore: (cleared: number) => void;
  avatar?: string;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<MazeState>(() => createMaze(Math.random, 1));
  const [level, setLevel] = useState(1);
  const cellRef = useRef(30);
  const levelRef = useRef(1);
  const soundRef = useRef(true);

  const configureCanvas = (s: MazeState) => {
    const cell = computeCell(s.cols, s.rows);
    cellRef.current = cell;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cw = s.cols * cell;
    const ch = s.rows * cell;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  useEffect(() => {
    soundRef.current = storage.getSettings().soundOn;
    levelRef.current = 1;
    setLevel(1);
    const fresh = createMaze(Math.random, 1);
    setState(fresh);
    configureCanvas(fresh);
    onScore(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- マウント時に1回
  }, []);

  // 状態が変わるたびに描画
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx, state, cellRef.current, avatar);
  }, [state, avatar]);

  // ゴール到達 → 次のレベル（大きい迷路）
  useEffect(() => {
    if (!state.over) return;
    const nextLevel = levelRef.current + 1;
    levelRef.current = nextLevel;
    setLevel(nextLevel);
    if (soundRef.current) sound.fanfare();
    onScore(nextLevel - 1); // クリアした迷路の数
    const fresh = createMaze(Math.random, nextLevel);
    setState(fresh);
    configureCanvas(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- state.over をトリガに進める
  }, [state.over]);

  const go = (d: Dir) => setState((s) => moveMaze(s, d));

  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopHold = () => {
    if (repeatRef.current) {
      clearInterval(repeatRef.current);
      repeatRef.current = null;
    }
  };
  const startHold = (d: Dir) => {
    go(d);
    stopHold();
    repeatRef.current = setInterval(() => go(d), 150);
  };
  useEffect(() => stopHold, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d = dirFromKey(e.key);
      if (d) {
        go(d);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    touchStart.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = (e: React.PointerEvent) => {
    const s0 = touchStart.current;
    touchStart.current = null;
    if (!s0) return;
    const dx = e.clientX - s0.x;
    const dy = e.clientY - s0.y;
    if (Math.abs(dx) < 14 && Math.abs(dy) < 14) return;
    if (Math.abs(dx) > Math.abs(dy)) go(dx > 0 ? 'right' : 'left');
    else go(dy > 0 ? 'down' : 'up');
  };

  const padBtn =
    'flex h-12 w-12 items-center justify-center rounded-xl bg-gray-200 text-xl font-bold text-gray-700 active:bg-gray-300 dark:bg-gray-700 dark:text-gray-200';

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
        レベル {level} ・ 🏁を めざそう！
      </p>
      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerUp={onUp}
        className="rounded-xl shadow-md"
        style={{ touchAction: 'none' }}
      />
      <div className="grid grid-cols-3 gap-2" aria-label="そうさボタン">
        <span />
        <MazePad dir="up" label="うえ" cls={padBtn} onHold={startHold} onRelease={stopHold}>
          ▲
        </MazePad>
        <span />
        <MazePad dir="left" label="ひだり" cls={padBtn} onHold={startHold} onRelease={stopHold}>
          ◀
        </MazePad>
        <span />
        <MazePad dir="right" label="みぎ" cls={padBtn} onHold={startHold} onRelease={stopHold}>
          ▶
        </MazePad>
        <span />
        <MazePad dir="down" label="した" cls={padBtn} onHold={startHold} onRelease={stopHold}>
          ▼
        </MazePad>
        <span />
      </div>
    </div>
  );
}

function MazePad({
  dir,
  label,
  cls,
  onHold,
  onRelease,
  children,
}: {
  dir: Dir;
  label: string;
  cls: string;
  onHold: (d: Dir) => void;
  onRelease: () => void;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <button
      type="button"
      className={cls}
      aria-label={label}
      onPointerDown={() => onHold(dir)}
      onPointerUp={onRelease}
      onPointerLeave={onRelease}
      onPointerCancel={onRelease}
    >
      {children}
    </button>
  );
}
