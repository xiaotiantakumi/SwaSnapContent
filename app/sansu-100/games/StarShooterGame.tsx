'use client';

import React, { useEffect, useRef, useState } from 'react';

import { startGameLoop } from '../lib/minigame-core';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

// ピューピュー星空（固定画面シューティング）
// 自機を左右に動かし、自動連射する弾で上から降ってくる隕石を壊す。
// 隕石が自機ラインまで届くとライフ-1。3回でゲームオーバー。制限時間30秒。

const W = 260;
const H = 340;
const SHIP_Y = H - 24;
const SHIP_R = 12;
const BULLET_R = 3;
const BULLET_SPEED = 6; // px/tick
const ENEMY_R = 12;
const ENEMY_SPEED = 1.4; // px/tick
const FIRE_INTERVAL_MS = 320;
const SPAWN_INTERVAL_MS = 850;
const GAME_DURATION_MS = 30000;
const LIVES = 3;

type Bullet = { x: number; y: number };
type Enemy = { x: number; y: number };

interface GS {
  shipX: number;
  bullets: Bullet[];
  enemies: Enemy[];
  score: number;
  lives: number;
  elapsedMs: number;
  nextFireAt: number;
  nextSpawnAt: number;
  over: boolean;
}

function createGS(): GS {
  return {
    shipX: W / 2,
    bullets: [],
    enemies: [],
    score: 0,
    lives: LIVES,
    elapsedMs: 0,
    nextFireAt: 0,
    nextSpawnAt: 0,
    over: false,
  };
}

function computeWidth(): number {
  if (typeof window === 'undefined') return W;
  return Math.max(220, Math.min(320, window.innerWidth - 48));
}

function tick(
  gs: GS,
  deltaMs: number,
  moveDir: number,
  rand: () => number,
  onEvent: (ev: 'hit' | 'miss' | 'over') => void
): void {
  if (gs.over) return;
  gs.elapsedMs += deltaMs;

  if (gs.elapsedMs >= GAME_DURATION_MS) {
    gs.over = true;
    onEvent('over');
    return;
  }

  // 自機移動
  gs.shipX = Math.max(SHIP_R, Math.min(W - SHIP_R, gs.shipX + moveDir * 4));

  // 自動連射
  if (gs.elapsedMs >= gs.nextFireAt) {
    gs.bullets.push({ x: gs.shipX, y: SHIP_Y - SHIP_R });
    gs.nextFireAt = gs.elapsedMs + FIRE_INTERVAL_MS;
  }

  // 隕石スポーン
  if (gs.elapsedMs >= gs.nextSpawnAt) {
    gs.enemies.push({ x: ENEMY_R + rand() * (W - ENEMY_R * 2), y: -ENEMY_R });
    gs.nextSpawnAt = gs.elapsedMs + SPAWN_INTERVAL_MS;
  }

  // 弾を進める
  gs.bullets = gs.bullets
    .map((b) => ({ x: b.x, y: b.y - BULLET_SPEED }))
    .filter((b) => b.y > -BULLET_R);

  // 隕石を進める
  gs.enemies = gs.enemies.map((e) => ({ x: e.x, y: e.y + ENEMY_SPEED }));

  // 弾×隕石の衝突判定
  const hitR = BULLET_R + ENEMY_R;
  const survivingEnemies: Enemy[] = [];
  for (const e of gs.enemies) {
    let hit = false;
    gs.bullets = gs.bullets.filter((b) => {
      if (hit) return true;
      const dx = b.x - e.x;
      const dy = b.y - e.y;
      if (dx * dx + dy * dy <= hitR * hitR) {
        hit = true;
        return false;
      }
      return true;
    });
    if (hit) {
      gs.score += 1;
      onEvent('hit');
    } else {
      survivingEnemies.push(e);
    }
  }
  gs.enemies = survivingEnemies;

  // 自機ラインを通り過ぎた隕石はミス扱い
  const remaining: Enemy[] = [];
  let missed = false;
  for (const e of gs.enemies) {
    if (e.y - ENEMY_R > SHIP_Y + SHIP_R) {
      missed = true;
    } else {
      remaining.push(e);
    }
  }
  gs.enemies = remaining;
  if (missed) {
    gs.lives -= 1;
    onEvent('miss');
    if (gs.lives <= 0) {
      gs.over = true;
      onEvent('over');
    }
  }
}

function draw(ctx: CanvasRenderingContext2D, gs: GS, scale: number): void {
  ctx.fillStyle = '#0b1023';
  ctx.fillRect(0, 0, W * scale, H * scale);

  // 自機ライン
  ctx.strokeStyle = 'rgba(148,163,184,0.4)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, (SHIP_Y + SHIP_R) * scale);
  ctx.lineTo(W * scale, (SHIP_Y + SHIP_R) * scale);
  ctx.stroke();
  ctx.setLineDash([]);

  // 隕石
  ctx.fillStyle = '#f97316';
  for (const e of gs.enemies) {
    ctx.beginPath();
    ctx.arc(e.x * scale, e.y * scale, ENEMY_R * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // 弾
  ctx.fillStyle = '#38bdf8';
  for (const b of gs.bullets) {
    ctx.beginPath();
    ctx.arc(b.x * scale, b.y * scale, BULLET_R * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // 自機
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(gs.shipX * scale, (SHIP_Y - SHIP_R) * scale);
  ctx.lineTo((gs.shipX - SHIP_R) * scale, (SHIP_Y + SHIP_R) * scale);
  ctx.lineTo((gs.shipX + SHIP_R) * scale, (SHIP_Y + SHIP_R) * scale);
  ctx.closePath();
  ctx.fill();
}

export default function StarShooterGame({
  onGameOver,
}: {
  onGameOver: (score: number) => void;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GS>(createGS());
  const moveRef = useRef(0);
  const scaleRef = useRef(1);
  const overRef = useRef(false);
  const soundRef = useRef(true);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
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

    gsRef.current = createGS();
    overRef.current = false;
    moveRef.current = 0;
    soundRef.current = storage.getSettings().soundOn;
    setScore(0);
    setLives(LIVES);
    setTimeLeft(Math.ceil(GAME_DURATION_MS / 1000));

    const rand = Math.random.bind(Math);

    const handle = startGameLoop({
      stepMs: () => 16,
      onTick: () => {
        if (overRef.current) return;
        const gs = gsRef.current;
        tick(gs, 16, moveRef.current, rand, (ev) => {
          if (ev === 'hit') {
            setScore(gs.score);
            if (soundRef.current) sound.eat();
          } else if (ev === 'miss') {
            setLives(Math.max(0, gs.lives));
            if (soundRef.current) sound.crash();
          } else if (ev === 'over' && !overRef.current) {
            overRef.current = true;
            handle.stop();
            onGameOver(gs.score);
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
    gsRef.current.shipX = Math.max(SHIP_R, Math.min(W - SHIP_R, logicalX));
  };

  const btn =
    'flex h-14 flex-1 items-center justify-center rounded-xl bg-gray-200 text-2xl font-bold text-gray-700 active:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 select-none';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-xs items-center justify-between px-1 text-sm font-bold text-gray-800 dark:text-gray-100">
        <span>スコア: <span className="tabular-nums" data-testid="starshooter-score">{score}</span></span>
        <span>{'❤️'.repeat(lives)}</span>
        <span className={timeLeft <= 5 ? 'text-red-600' : ''}>⏱ {timeLeft}秒</span>
      </div>
      <canvas
        ref={canvasRef}
        data-testid="starshooter-canvas"
        onPointerDown={onMove}
        onPointerMove={onMove}
        className="touch-none rounded-xl shadow-md"
        style={{ touchAction: 'none' }}
      />
      <p className="text-xs text-gray-500 dark:text-gray-400">
        ゆびで うごかす、ボタンでもOK（たまは じどうで でるよ）
      </p>
      <div className="flex w-full max-w-xs gap-3">
        <button
          type="button"
          className={btn}
          data-testid="starshooter-left"
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
          data-testid="starshooter-right"
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
