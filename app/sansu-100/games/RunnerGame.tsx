'use client';

import React, { useEffect, useRef, useState } from 'react';

import {
  createRunner,
  RUNNER,
  stepRunner,
  type RunnerState,
} from '../lib/games/runner';
import { isActionKey, startGameLoop } from '../lib/minigame-core';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

const RUNNER_CHAR = '🦖'; // よけよけランナー専用キャラ（アバターは使わない）

function computeWidth(): number {
  if (typeof window === 'undefined') return 320;
  return Math.max(260, Math.min(380, window.innerWidth - 32));
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
  s: RunnerState,
  w: number,
  scale: number
): void {
  const h = RUNNER.worldH * scale;
  // 空（レベルが上がるほど夕方→夜っぽく）
  const sky = ['#bae6fd', '#a5b4fc', '#818cf8', '#6366f1', '#4338ca'][
    Math.min(4, s.level - 1)
  ];
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const yGround = (RUNNER.worldH - RUNNER.groundH) * scale;
  // 地面
  ctx.fillStyle = '#65a30d';
  ctx.fillRect(0, yGround, w, h - yGround);
  // ふゆう台
  for (const p of s.platforms) {
    const py = yGround - p.top * scale;
    ctx.fillStyle = '#a16207';
    ctx.fillRect(p.x * scale, py, p.w * scale, 7 * scale);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(p.x * scale, py, p.w * scale, 2.5 * scale);
  }
  // 障害物（高い壁 or サボテン）
  for (const o of s.obstacles) {
    if (o.h > 40) {
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(o.x * scale, yGround - o.h * scale, o.w * scale, o.h * scale);
    } else {
      emoji(
        ctx,
        '🌵',
        (o.x + o.w / 2) * scale,
        yGround - (o.h / 2) * scale,
        o.h * scale * 1.4
      );
    }
  }
  // プレイヤー（🦖は絵文字フォント上デフォルトで左向きのため、進行方向（右）を
  // 向かせるために水平反転させて描く）
  const cx = (RUNNER.playerX + RUNNER.playerW / 2) * scale;
  const cy = yGround - (s.py + RUNNER.playerH / 2) * scale;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(-1, 1);
  emoji(ctx, RUNNER_CHAR, 0, 0, RUNNER.playerH * scale * 1.5);
  ctx.restore();
}

// よけよけランナー本体。タップ/スペース/↑ でジャンプ。台に乗って降りられる。
export default function RunnerGame({
  onGameOver,
}: {
  onGameOver: (score: number) => void;
  avatar?: string;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<RunnerState>(createRunner(Math.random));
  const jumpRef = useRef(false);
  const overRef = useRef(false);
  const soundRef = useRef(true);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [flash, setFlash] = useState(false);

  const jump = () => {
    jumpRef.current = true;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cw = computeWidth();
    const scale = cw / RUNNER.worldW;
    const ch = RUNNER.worldH * scale;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    stateRef.current = createRunner(Math.random);
    jumpRef.current = false;
    overRef.current = false;
    soundRef.current = storage.getSettings().soundOn;
    setScore(0);
    setLevel(1);

    const handle = startGameLoop({
      stepMs: () => 40,
      onTick: () => {
        if (overRef.current) return;
        const wasGround = stateRef.current.onGround;
        const next = stepRunner(stateRef.current, jumpRef.current, Math.random);
        if (wasGround && !next.onGround && soundRef.current) sound.eat();
        if (next.leveledUp) {
          setLevel(next.level);
          setFlash(true);
          window.setTimeout(() => setFlash(false), 700);
          if (soundRef.current) sound.correct();
        }
        jumpRef.current = false;
        stateRef.current = next;
        setScore(next.distance);
        if (next.over) {
          overRef.current = true;
          handle.stop();
          if (soundRef.current) sound.crash();
          onGameOver(next.distance);
        }
      },
      onRender: () => draw(ctx, stateRef.current, cw, scale),
    });

    const onKey = (e: KeyboardEvent) => {
      if (isActionKey(e.key)) {
        jump();
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
        レベル {level} ・ きょり <span className="tabular-nums">{score}</span>
      </p>
      {/* レベルアップ表示はcanvasの上に絶対配置のオーバーレイとして重ねる。
          スコア行に直接テキストを差し込むと行の高さが変わり、下のジャンプ操作の
          位置がタップ中にずれてしまう（レイアウトシフト）ため、フローの外に置く。 */}
      <div className="relative">
        {flash ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-2 z-10 animate-pulse text-center text-lg font-extrabold text-orange-500"
            style={{ textShadow: '0 0 6px rgba(255,255,255,0.9)' }}
          >
            ⬆️ レベルアップ！
          </div>
        ) : null}
        <canvas
          ref={canvasRef}
          onPointerDown={jump}
          className="rounded-xl shadow-md"
          style={{ touchAction: 'none' }}
        />
      </div>
      <button
        type="button"
        onClick={jump}
        className="w-full max-w-xs rounded-xl bg-purple-500 py-4 text-lg font-bold text-white active:bg-purple-600"
        aria-label="ジャンプ"
      >
        ⬆️ ジャンプ
      </button>
    </div>
  );
}
