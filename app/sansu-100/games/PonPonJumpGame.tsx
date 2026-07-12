'use client';

import React, { useEffect, useRef, useState } from 'react';

import { startGameLoop } from '../lib/minigame-core';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

// ぽんぽんジャンプ（縦スクロールジャンプアクション）
// キャラクターが自動で跳ね続けるので、左右に動かして足場を乗り継ぎ、上へ登っていく。
// 画面下（カメラの外）に落ちたら終了。到達した高さがスコア。

const W = 260;
const H = 380;
const PLAYER_R = 10;
const GRAVITY = 0.35;
const JUMP_VY = -9.5;
const MOVE_SPEED = 4;
const PLAT_W = 52;
const PLAT_H = 8;
const PLAT_GAP_MIN = 42;
const PLAT_GAP_MAX = 72;

type Platform = { x: number; y: number };

interface GS {
  playerX: number;
  playerY: number;
  vy: number;
  platforms: Platform[];
  cameraY: number; // 画面上端に対応するワールドY（値が小さいほど高い）
  maxHeight: number; // これまでの最高到達スコア（登った高さ）
  over: boolean;
}

function createGS(rand: () => number): GS {
  const platforms: Platform[] = [];
  // 最初の足場（プレイヤーの真下）
  platforms.push({ x: W / 2 - PLAT_W / 2, y: H - 30 });
  let y = H - 30;
  while (y > -H) {
    y -= PLAT_GAP_MIN + rand() * (PLAT_GAP_MAX - PLAT_GAP_MIN);
    const x = rand() * (W - PLAT_W);
    platforms.push({ x, y });
  }
  return {
    playerX: W / 2,
    playerY: H - 30 - PLAYER_R,
    vy: JUMP_VY,
    platforms,
    cameraY: 0,
    maxHeight: 0,
    over: false,
  };
}

function tick(
  gs: GS,
  moveDir: number,
  rand: () => number,
  onEvent: (ev: 'bounce' | 'over') => void
): void {
  if (gs.over) return;

  gs.playerX += moveDir * MOVE_SPEED;
  if (gs.playerX < -PLAYER_R) gs.playerX = W + PLAYER_R;
  if (gs.playerX > W + PLAYER_R) gs.playerX = -PLAYER_R;

  const prevY = gs.playerY;
  gs.vy += GRAVITY;
  gs.playerY += gs.vy;

  // 足場との当たり判定（落下中のみ、かつ足場を上から踏んだときだけ）
  if (gs.vy > 0) {
    for (const p of gs.platforms) {
      const withinX = gs.playerX + PLAYER_R > p.x && gs.playerX - PLAYER_R < p.x + PLAT_W;
      const crossing =
        prevY + PLAYER_R <= p.y && gs.playerY + PLAYER_R >= p.y && gs.playerY + PLAYER_R <= p.y + PLAT_H + 6;
      if (withinX && crossing) {
        gs.vy = JUMP_VY;
        gs.playerY = p.y - PLAYER_R;
        onEvent('bounce');
        break;
      }
    }
  }

  // カメラをプレイヤーの最高到達点に合わせて上へスクロール
  const margin = H * 0.4;
  if (gs.playerY < gs.cameraY + margin) {
    const dy = gs.cameraY + margin - gs.playerY;
    gs.cameraY -= dy;
    gs.maxHeight = Math.max(gs.maxHeight, Math.floor(-gs.cameraY / 10));

    // 足場を上に補充する
    let topY = Math.min(...gs.platforms.map((p) => p.y));
    while (topY > gs.cameraY - H) {
      topY -= PLAT_GAP_MIN + rand() * (PLAT_GAP_MAX - PLAT_GAP_MIN);
      gs.platforms.push({ x: rand() * (W - PLAT_W), y: topY });
    }
    // 画面外に大きく外れた（下に落ちた）足場は掃除
    gs.platforms = gs.platforms.filter((p) => p.y < gs.cameraY + H + 100);
  }

  // 画面（カメラ）の下端より下に落ちたら終了
  if (gs.playerY - gs.cameraY > H + PLAYER_R * 3) {
    gs.over = true;
    onEvent('over');
  }
}

function draw(ctx: CanvasRenderingContext2D, gs: GS, scale: number): void {
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(0, 0, W * scale, H * scale);

  ctx.fillStyle = '#22c55e';
  for (const p of gs.platforms) {
    const sy = (p.y - gs.cameraY) * scale;
    if (sy < -PLAT_H * scale || sy > H * scale) continue;
    ctx.fillRect(p.x * scale, sy, PLAT_W * scale, PLAT_H * scale);
  }

  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(
    gs.playerX * scale,
    (gs.playerY - gs.cameraY) * scale,
    PLAYER_R * scale,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function computeWidth(): number {
  if (typeof window === 'undefined') return W;
  return Math.max(220, Math.min(320, window.innerWidth - 48));
}

export default function PonPonJumpGame({
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
  const [height, setHeight] = useState(0);

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
    setHeight(0);

    const handle = startGameLoop({
      stepMs: () => 16,
      onTick: () => {
        if (overRef.current) return;
        const gs = gsRef.current;
        tick(gs, moveRef.current, rand, (ev) => {
          if (ev === 'bounce' && soundRef.current) sound.correct();
          if (ev === 'over' && !overRef.current) {
            overRef.current = true;
            handle.stop();
            if (soundRef.current) sound.crash();
            onGameOver(gs.maxHeight);
          }
        });
        setHeight(gs.maxHeight);
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
    gsRef.current.playerX = logicalX;
  };

  const btn =
    'flex h-14 flex-1 items-center justify-center rounded-xl bg-gray-200 text-2xl font-bold text-gray-700 active:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 select-none';

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
        たかさ: <span className="tabular-nums" data-testid="ponpon-height">{height}</span>
      </p>
      <canvas
        ref={canvasRef}
        data-testid="ponpon-canvas"
        onPointerDown={onMove}
        onPointerMove={onMove}
        className="touch-none rounded-xl shadow-md"
        style={{ touchAction: 'none' }}
      />
      <p className="text-xs text-gray-500 dark:text-gray-400">
        ゆびで うごかす、ボタンでもOK（じどうで ジャンプするよ）
      </p>
      <div className="flex w-full max-w-xs gap-3">
        <button
          type="button"
          className={btn}
          data-testid="ponpon-left"
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
          data-testid="ponpon-right"
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
