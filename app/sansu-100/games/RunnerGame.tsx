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

const WORLD_H = 110; // 論理ワールド高さ（描画用）

function computeWidth(): number {
  if (typeof window === 'undefined') return 300;
  return Math.max(240, Math.min(360, window.innerWidth - 40));
}

function draw(
  ctx: CanvasRenderingContext2D,
  s: RunnerState,
  w: number,
  scale: number
): void {
  const h = WORLD_H * scale;
  // 空
  ctx.fillStyle = '#bae6fd';
  ctx.fillRect(0, 0, w, h);
  const yGround = (WORLD_H - RUNNER.groundH) * scale;
  // 地面
  ctx.fillStyle = '#65a30d';
  ctx.fillRect(0, yGround, w, h - yGround);
  // 障害物
  ctx.fillStyle = '#7c2d12';
  for (const o of s.obstacles) {
    ctx.fillRect(o.x * scale, yGround - o.h * scale, o.w * scale, o.h * scale);
  }
  // プレイヤー
  const px = RUNNER.playerX * scale;
  const ptop = yGround - (s.py + RUNNER.playerH) * scale;
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(px, ptop, RUNNER.playerW * scale, RUNNER.playerH * scale);
  // 目（かわいく）
  ctx.fillStyle = '#fff';
  ctx.fillRect(
    px + RUNNER.playerW * scale * 0.55,
    ptop + RUNNER.playerH * scale * 0.2,
    Math.max(2, 3 * scale),
    Math.max(2, 3 * scale)
  );
}

// よけよけランナー本体。タップ/スペース/↑ でジャンプ。world はロジック、描画はスケール。
export default function RunnerGame({
  onGameOver,
}: {
  onGameOver: (score: number) => void;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<RunnerState>(createRunner(Math.random));
  const jumpRef = useRef(false);
  const overRef = useRef(false);
  const soundRef = useRef(true);
  const [score, setScore] = useState(0);

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
    const ch = WORLD_H * scale;
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

    const handle = startGameLoop({
      stepMs: () => 40,
      onTick: () => {
        if (overRef.current) return;
        const wasGround = stateRef.current.onGround;
        const next = stepRunner(stateRef.current, jumpRef.current, Math.random);
        // ジャンプ音（接地→空中に変わった瞬間）
        if (wasGround && !next.onGround && soundRef.current) sound.eat();
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
        きょり: <span className="tabular-nums">{score}</span>
      </p>
      <canvas
        ref={canvasRef}
        onPointerDown={jump}
        className="rounded-xl shadow-md"
        style={{ touchAction: 'none' }}
      />
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
