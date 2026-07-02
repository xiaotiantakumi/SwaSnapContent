'use client';

import React, { useEffect, useRef, useState } from 'react';

import { startGameLoop } from '../lib/minigame-core';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

// はじいてホッケー（エアホッケー風の反射ゲーム）
// 下のマレット（自分）を左右に動かしてパックを打ち返し、上の相手ゴールに入れる。
// 相手（CPU）は自動でパックを追いかける。制限時間30秒、または5点差をつけられると終了。

const W = 260;
const H = 380;
const PADDLE_W = 56;
const PADDLE_H = 10;
const PLAYER_Y = H - 24;
const CPU_Y = 24;
const PUCK_R = 8;
const CPU_SPEED = 2.4;
const GAME_DURATION_MS = 30000;
const LOSE_MARGIN = 5;
const PUCK_SPEED_INIT = 2.6;
const PUCK_SPEED_MAX = 6;

interface GS {
  playerX: number;
  cpuX: number;
  puckX: number;
  puckY: number;
  puckVX: number;
  puckVY: number;
  playerScore: number;
  cpuScore: number;
  elapsedMs: number;
  over: boolean;
}

function servePuck(gs: GS, rand: () => number): void {
  gs.puckX = W / 2;
  gs.puckY = H / 2;
  const angle = (rand() * 0.8 - 0.4) * Math.PI; // ほぼ縦方向、ややランダムに左右
  const dir = rand() < 0.5 ? 1 : -1;
  gs.puckVX = Math.sin(angle) * PUCK_SPEED_INIT;
  gs.puckVY = Math.cos(angle) * PUCK_SPEED_INIT * dir;
}

function createGS(rand: () => number): GS {
  const gs: GS = {
    playerX: W / 2 - PADDLE_W / 2,
    cpuX: W / 2 - PADDLE_W / 2,
    puckX: W / 2,
    puckY: H / 2,
    puckVX: 0,
    puckVY: 0,
    playerScore: 0,
    cpuScore: 0,
    elapsedMs: 0,
    over: false,
  };
  servePuck(gs, rand);
  return gs;
}

const PUCK_VY_MIN = 1.5; // これ未満だとパックがほぼ水平に張り付いて停滞するので下限を設ける

function reflectOffPaddle(gs: GS, paddleX: number, goingDown: boolean): void {
  const hitOffset = (gs.puckX - (paddleX + PADDLE_W / 2)) / (PADDLE_W / 2); // -1..1
  gs.puckVY = goingDown ? -Math.abs(gs.puckVY) : Math.abs(gs.puckVY);
  gs.puckVX += hitOffset * 1.5;
  const speed = Math.hypot(gs.puckVX, gs.puckVY);
  if (speed > PUCK_SPEED_MAX) {
    const s = PUCK_SPEED_MAX / speed;
    gs.puckVX *= s;
    gs.puckVY *= s;
  }
  if (Math.abs(gs.puckVY) < PUCK_VY_MIN) {
    gs.puckVY = Math.sign(gs.puckVY) * PUCK_VY_MIN;
  }
}

function tick(
  gs: GS,
  deltaMs: number,
  moveDir: number,
  rand: () => number,
  onEvent: (ev: 'hit' | 'score' | 'over') => void
): void {
  if (gs.over) return;
  gs.elapsedMs += deltaMs;

  if (gs.elapsedMs >= GAME_DURATION_MS) {
    gs.over = true;
    onEvent('over');
    return;
  }

  // プレイヤーマレット移動
  gs.playerX = Math.max(0, Math.min(W - PADDLE_W, gs.playerX + moveDir * 4));

  // CPUマレットはパックを追いかける
  const cpuCenter = gs.cpuX + PADDLE_W / 2;
  if (Math.abs(gs.puckX - cpuCenter) > 2) {
    gs.cpuX += Math.sign(gs.puckX - cpuCenter) * CPU_SPEED;
  }
  gs.cpuX = Math.max(0, Math.min(W - PADDLE_W, gs.cpuX));

  // パック移動
  gs.puckX += gs.puckVX;
  gs.puckY += gs.puckVY;

  // 左右の壁で反射
  if (gs.puckX - PUCK_R < 0) {
    gs.puckX = PUCK_R;
    gs.puckVX = Math.abs(gs.puckVX);
  } else if (gs.puckX + PUCK_R > W) {
    gs.puckX = W - PUCK_R;
    gs.puckVX = -Math.abs(gs.puckVX);
  }

  // プレイヤーマレットとの衝突（下向き移動中のみ）
  if (
    gs.puckVY > 0 &&
    gs.puckY + PUCK_R >= PLAYER_Y &&
    gs.puckY + PUCK_R <= PLAYER_Y + PADDLE_H + 8 &&
    gs.puckX >= gs.playerX - PUCK_R &&
    gs.puckX <= gs.playerX + PADDLE_W + PUCK_R
  ) {
    gs.puckY = PLAYER_Y - PUCK_R;
    reflectOffPaddle(gs, gs.playerX, true);
    onEvent('hit');
  }

  // CPUマレットとの衝突（上向き移動中のみ）
  if (
    gs.puckVY < 0 &&
    gs.puckY - PUCK_R <= CPU_Y + PADDLE_H &&
    gs.puckY - PUCK_R >= CPU_Y - 8 &&
    gs.puckX >= gs.cpuX - PUCK_R &&
    gs.puckX <= gs.cpuX + PADDLE_W + PUCK_R
  ) {
    gs.puckY = CPU_Y + PADDLE_H + PUCK_R;
    reflectOffPaddle(gs, gs.cpuX, false);
    onEvent('hit');
  }

  // ゴール判定
  if (gs.puckY - PUCK_R < -6) {
    gs.playerScore += 1;
    onEvent('score');
    servePuck(gs, rand);
  } else if (gs.puckY + PUCK_R > H + 6) {
    gs.cpuScore += 1;
    onEvent('score');
    servePuck(gs, rand);
    if (gs.cpuScore - gs.playerScore >= LOSE_MARGIN) {
      gs.over = true;
      onEvent('over');
    }
  }
}

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
