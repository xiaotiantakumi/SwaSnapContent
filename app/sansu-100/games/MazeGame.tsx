'use client';

import React, { useEffect, useRef, useState } from 'react';

import { createMaze, moveMaze, N, E, S, W, type MazeState } from '../lib/games/maze';
import { dirFromKey, type Dir } from '../lib/minigame-core';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

function computeCell(cols: number, rows: number): number {
  if (typeof window === 'undefined') return 36;
  const byW = (window.innerWidth - 48) / cols;
  const byH = (window.innerHeight - 300) / rows;
  return Math.max(22, Math.min(44, byW, byH));
}

function draw(
  ctx: CanvasRenderingContext2D,
  s: MazeState,
  cell: number,
  avatar: string
): void {
  const W0 = s.cols * cell;
  const H0 = s.rows * cell;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, W0, H0);
  // ゴール
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(s.gx * cell, s.gy * cell, cell, cell);
  // 壁
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
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
  // ゴール旗
  ctx.font = `${cell * 0.7}px "Apple Color Emoji","Segoe UI Emoji",serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏁', s.gx * cell + cell / 2, s.gy * cell + cell / 2);
  // プレイヤー
  ctx.font = `${cell * 0.8}px "Apple Color Emoji","Segoe UI Emoji",serif`;
  ctx.fillText(avatar, s.px * cell + cell / 2, s.py * cell + cell / 2);
}

// めいろ。スワイプ／十字／矢印で1マスずつ進み、🏁を目指す。
export default function MazeGame({
  onGameOver,
  avatar = '🐰',
}: {
  onGameOver: (score: number) => void;
  avatar?: string;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<MazeState>(() => createMaze(Math.random));
  const cellRef = useRef(36);
  const overFired = useRef(false);
  const soundRef = useRef(true);

  // 初期化（セルサイズ・キャンバス）
  useEffect(() => {
    soundRef.current = storage.getSettings().soundOn;
    const fresh = createMaze(Math.random);
    setState(fresh);
    overFired.current = false;
    const cell = computeCell(fresh.cols, fresh.rows);
    cellRef.current = cell;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cw = fresh.cols * cell;
    const ch = fresh.rows * cell;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  // 状態が変わるたびに描画
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx, state, cellRef.current, avatar);
  }, [state, avatar]);

  // クリア
  useEffect(() => {
    if (state.over && !overFired.current) {
      overFired.current = true;
      if (soundRef.current) sound.fanfare();
      onGameOver(Math.max(1, 150 - state.moves));
    }
  }, [state.over, state.moves, onGameOver]);

  const go = (d: Dir) => setState((s) => moveMaze(s, d));

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

  // スワイプ
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
        🏁を めざそう！ あるいた かず: {state.moves}
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
        <button type="button" className={padBtn} onClick={() => go('up')} aria-label="うえ">
          ▲
        </button>
        <span />
        <button type="button" className={padBtn} onClick={() => go('left')} aria-label="ひだり">
          ◀
        </button>
        <span />
        <button type="button" className={padBtn} onClick={() => go('right')} aria-label="みぎ">
          ▶
        </button>
        <span />
        <button type="button" className={padBtn} onClick={() => go('down')} aria-label="した">
          ▼
        </button>
        <span />
      </div>
    </div>
  );
}
