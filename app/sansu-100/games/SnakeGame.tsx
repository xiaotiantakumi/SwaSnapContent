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
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

const GRID = 15;

// 画面に収まる正方サイズを決める。横幅と「縦の余白（ヘッダ/操作ボタン分）」の小さい方。
// これで iPhone でも操作ボタンが画面内に収まる。
function computeSize(): number {
  if (typeof window === 'undefined') return 300;
  const w = window.innerWidth - 40; // 左右マージン
  const h = window.innerHeight - 300; // スコア＋十字ボタン＋余白の予約
  return Math.max(200, Math.min(330, w, h));
}

function draw(
  ctx: CanvasRenderingContext2D,
  s: SnakeState,
  size: number,
  cell: number
): void {
  clearCanvas(ctx, size, '#0f172a');
  // snake（頭は濃い緑）
  s.snake.forEach((c, i) =>
    drawCell(ctx, c.x, c.y, cell, i === 0 ? '#16a34a' : '#4ade80')
  );
  // food（りんご絵文字）
  ctx.font = `${cell * 0.9}px "Apple Color Emoji","Segoe UI Emoji",serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🍎', s.food.x * cell + cell / 2, s.food.y * cell + cell / 2);
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
  const soundRef = useRef(true);
  const [score, setScore] = useState(0);

  const setDir = (d: Dir) => {
    dirRef.current = d;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = computeSize();
    const cell = size / GRID;
    const ctx = setupCanvas(canvas, size);
    if (!ctx) return;
    stateRef.current = createSnake(GRID, Math.random);
    dirRef.current = 'right';
    overRef.current = false;
    soundRef.current = storage.getSettings().soundOn;
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
        const prevScore = stateRef.current.score;
        const next = stepSnake(stateRef.current, dirRef.current, Math.random);
        stateRef.current = next;
        setScore(next.score); // 同値なら React が再描画を省く
        if (next.score > prevScore && soundRef.current) sound.eat();
        if (next.over) {
          overRef.current = true;
          handle.stop();
          if (soundRef.current) sound.crash();
          onGameOver(next.score);
        }
      },
      onRender: () => draw(ctx, stateRef.current, size, cell),
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

  // スワイプ（フリック）で方向転換。指で画面が隠れにくく、子どもに直感的。
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onCanvasDown = (e: React.PointerEvent) => {
    touchStart.current = { x: e.clientX, y: e.clientY };
  };
  const onCanvasUp = (e: React.PointerEvent) => {
    const s0 = touchStart.current;
    touchStart.current = null;
    if (!s0) return;
    const dx = e.clientX - s0.x;
    const dy = e.clientY - s0.y;
    if (Math.abs(dx) < 14 && Math.abs(dy) < 14) return; // タップは無視
    if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 'right' : 'left');
    else setDir(dy > 0 ? 'down' : 'up');
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
        スコア: <span className="tabular-nums">{score}</span>
      </p>
      <canvas
        ref={canvasRef}
        onPointerDown={onCanvasDown}
        onPointerUp={onCanvasUp}
        className="rounded-xl shadow-md"
        style={{ touchAction: 'none' }}
      />
      <p className="text-xs text-gray-500 dark:text-gray-400">
        ゆびで すいっとスワイプ、ボタンでもOK
      </p>
      {/* 十字コントロール（逆T字＝上 / 左右 / 下） */}
      <div className="grid grid-cols-3 gap-2" aria-label="そうさボタン">
        <span />
        <button type="button" className={padBtn} onClick={() => setDir('up')} aria-label="うえ">
          ▲
        </button>
        <span />
        <button type="button" className={padBtn} onClick={() => setDir('left')} aria-label="ひだり">
          ◀
        </button>
        <span />
        <button type="button" className={padBtn} onClick={() => setDir('right')} aria-label="みぎ">
          ▶
        </button>
        <span />
        <button type="button" className={padBtn} onClick={() => setDir('down')} aria-label="した">
          ▼
        </button>
        <span />
      </div>
    </div>
  );
}
