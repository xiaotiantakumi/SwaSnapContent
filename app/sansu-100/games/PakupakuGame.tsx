'use client';
// パクパクおじさん（ドットイート）
// 独自要素:
//   背後ステルス - 弱った敵はうしろから接触したときだけ倒せる（正面 → 相打ちでミス）

import React, { useEffect, useRef, useState } from 'react';

import {
  DIR_VECTORS,
  dirFromKey,
  startGameLoop,
  type Dir,
} from '../lib/minigame-core';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

import {
  BASE_MAZE,
  COLS,
  ROWS,
  createGS,
  tickGame,
  type GS,
} from './logic/pakupaku-logic';

// ── Canvas layout ─────────────────────────────────────────────────────────
function computeLayout(): { cell: number; cw: number; ch: number } {
  if (typeof window === 'undefined') return { cell: 18, cw: 306, ch: 270 };
  const maxW = window.innerWidth - 32;
  const maxH = window.innerHeight - 360;
  const cell = Math.max(14, Math.min(22, Math.floor(Math.min(maxW / COLS, maxH / ROWS))));
  return { cell, cw: cell * COLS, ch: cell * ROWS };
}

// ── Drawing ───────────────────────────────────────────────────────────────
function drawGame(
  ctx: CanvasRenderingContext2D,
  gs: GS,
  cell: number,
): void {
  const cw = cell * COLS;
  const ch = cell * ROWS;

  ctx.fillStyle = '#050520';
  ctx.fillRect(0, 0, cw, ch);

  // Maze
  BASE_MAZE.forEach((c, i) => {
    const cx = (i % COLS) * cell;
    const cy = Math.floor(i / COLS) * cell;
    if (c === 1) {
      ctx.fillStyle = '#0d0d6e';
      ctx.fillRect(cx, cy, cell, cell);
      ctx.strokeStyle = '#2a2aae';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(cx + 0.5, cy + 0.5, cell - 1, cell - 1);
    } else if (c === 4) {
      ctx.fillStyle = '#1a0a20';
      ctx.fillRect(cx, cy, cell, cell);
    }
    const mx = cx + cell / 2;
    const my = cy + cell / 2;
    if (gs.dots.has(i)) {
      ctx.fillStyle = '#ffeedd';
      ctx.beginPath();
      ctx.arc(mx, my, cell * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    if (gs.powers.has(i)) {
      const blink = gs.tick % 8 < 5;
      if (blink) {
        ctx.fillStyle = '#ffe080';
        ctx.beginPath();
        ctx.arc(mx, my, cell * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });

  // Ghosts
  for (const g of gs.ghosts) {
    const gcx = g.x * cell + cell / 2;
    const gcy = g.y * cell + cell / 2;
    const r = cell * 0.4;

    let fill = g.color;
    if (g.mode === 'scared') {
      fill = g.scaredTicks < 25 && gs.tick % 6 < 3 ? '#ffffff' : '#2244ff';
    } else if (g.mode === 'dead') {
      fill = 'rgba(100,130,255,0.5)';
    } else if (g.mode === 'house') {
      fill = g.color + '88';
    }

    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(gcx, gcy - r * 0.1, r, Math.PI, 0);
    const bY = gcy + r * 0.85;
    const seg = (r * 2) / 3;
    for (let s = 0; s < 3; s++) {
      const sx = gcx - r + s * seg;
      ctx.quadraticCurveTo(sx + seg * 0.25, bY + r * 0.3, sx + seg * 0.5, bY);
      ctx.quadraticCurveTo(sx + seg * 0.75, bY - r * 0.25, sx + seg, bY);
    }
    ctx.lineTo(gcx + r, gcy - r * 0.1);
    ctx.closePath();
    ctx.fill();

    if (g.mode !== 'scared' && g.mode !== 'dead') {
      const dv = DIR_VECTORS[g.dir];
      [-0.28, 0.28].forEach((ox) => {
        const ex = gcx + ox * r + dv.x * r * 0.1;
        const ey = gcy - r * 0.18 + dv.y * r * 0.1;
        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.arc(ex, ey, r * 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0000cc';
        ctx.beginPath();
        ctx.arc(ex + dv.x * r * 0.1, ey + dv.y * r * 0.1, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  // Player（死亡中はフェードアウト点滅、無敵中は高速点滅）
  const isInvincible = !gs.player.dead && gs.tick < gs.player.invincibleUntil;
  const showPlayer = (!gs.player.dead || gs.tick % 5 < 4) && (!isInvincible || gs.tick % 4 < 3);
  if (showPlayer) {
    const { x: px, y: py } = gs.player;
    const pcx = px * cell + cell / 2;
    const pcy = py * cell + cell / 2;
    ctx.font = `${Math.floor(cell * 0.85)}px "Apple Color Emoji","Segoe UI Emoji",serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👴', pcx, pcy);
  }
}

// ── Component ─────────────────────────────────────────────────────────────
export default function PakupakuGame({
  onGameOver,
}: {
  onGameOver: (score: number) => void;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GS>(createGS());
  const overRef = useRef(false);
  const layoutRef = useRef(computeLayout());
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  // 押している間だけ進む（離すと止まる）。キー/ボタン/ドラッグのいずれかで更新する。
  const heldDirRef = useRef<Dir | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { cell, cw, ch } = computeLayout();
    layoutRef.current = { cell, cw, ch };

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const gs = createGS(storage.getSettings().soundOn);
    gsRef.current = gs;
    overRef.current = false;

    const rng = Math.random.bind(Math);
    let prevScore = 0;

    const handle = startGameLoop({
      stepMs: () => 100,
      onTick: () => {
        if (overRef.current) return;
        tickGame(gs, heldDirRef.current, rng, (ev) => {
          if (ev === 'dot' && gs.soundOn) sound.eat();
          if (ev === 'die' && gs.soundOn) sound.crash();
          if (ev === 'kill' && gs.soundOn) sound.eat();
        });
        if (gs.score !== prevScore) {
          prevScore = gs.score;
          setScore(gs.score);
        }
        setLives(gs.lives);
        if (gs.over && !overRef.current) {
          overRef.current = true;
          handle.stop();
          onGameOver(gs.score);
        }
      },
      onRender: () => drawGame(ctx, gsRef.current, layoutRef.current.cell),
    });

    const onKeyDown = (e: KeyboardEvent) => {
      const d = dirFromKey(e.key);
      if (d) { heldDirRef.current = d; e.preventDefault(); }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const d = dirFromKey(e.key);
      // 今まさに押している方向のキーを離したときだけ止める
      // （別の古いキーのkeyupで現在の入力を誤って消さないため）
      if (d && heldDirRef.current === d) heldDirRef.current = null;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      handle.stop();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ボタン: 押している間だけ進む。同じボタンを離したときだけ止める。
  const pressDir = (d: Dir) => { heldDirRef.current = d; };
  const releaseDir = (d: Dir) => {
    if (heldDirRef.current === d) heldDirRef.current = null;
  };

  // ドラッグ: 指を置いている間、動かした方向へ進み続ける（離すと止まる）。
  const touch = useRef<{ x: number; y: number } | null>(null);
  const padBtn = 'flex h-12 w-12 select-none items-center justify-center rounded-xl bg-gray-200 text-xl font-bold text-gray-700 active:bg-gray-300 dark:bg-gray-700 dark:text-gray-200';
  // 連打時にテキスト選択状態になり、ブラウザが選択範囲をリンクとして解釈して
  // 別画面へ遷移してしまう事故を防ぐ（select-noneだけでは連打耐性が不十分なため
  // pointerdown側でもpreventDefaultする）。
  const noSelectStyle: React.CSSProperties = { touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* HUD */}
      <div className="flex w-full items-center justify-between px-1 text-sm font-bold text-gray-800 dark:text-gray-100">
        <span>スコア: <span className="tabular-nums">{score}</span></span>
        <span>{'❤️'.repeat(lives)}</span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="rounded-xl shadow-lg"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => { touch.current = { x: e.clientX, y: e.clientY }; }}
        onPointerMove={(e) => {
          const s0 = touch.current;
          if (!s0) return;
          const dx = e.clientX - s0.x, dy = e.clientY - s0.y;
          if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
          heldDirRef.current = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        }}
        onPointerUp={() => { touch.current = null; heldDirRef.current = null; }}
        onPointerLeave={() => { touch.current = null; heldDirRef.current = null; }}
      />

      <p className="text-xs text-gray-500 dark:text-gray-400">
        ゆびを おいたまま うごかそう（まともに ぶつかると やられるよ）
      </p>

      {/* Direction pad（押している間だけ進む） */}
      <div className="grid grid-cols-3 gap-2" aria-label="そうさボタン">
        <span/>
        <button
          type="button"
          className={padBtn}
          style={noSelectStyle}
          onPointerDown={(e) => { e.preventDefault(); pressDir('up'); }}
          onPointerUp={() => releaseDir('up')}
          onPointerLeave={() => releaseDir('up')}
          aria-label="うえ"
        >▲</button>
        <span/>
        <button
          type="button"
          className={padBtn}
          style={noSelectStyle}
          onPointerDown={(e) => { e.preventDefault(); pressDir('left'); }}
          onPointerUp={() => releaseDir('left')}
          onPointerLeave={() => releaseDir('left')}
          aria-label="ひだり"
        >◀</button>
        <span/>
        <button
          type="button"
          className={padBtn}
          style={noSelectStyle}
          onPointerDown={(e) => { e.preventDefault(); pressDir('right'); }}
          onPointerUp={() => releaseDir('right')}
          onPointerLeave={() => releaseDir('right')}
          aria-label="みぎ"
        >▶</button>
        <span/>
        <button
          type="button"
          className={padBtn}
          style={noSelectStyle}
          onPointerDown={(e) => { e.preventDefault(); pressDir('down'); }}
          onPointerUp={() => releaseDir('down')}
          onPointerLeave={() => releaseDir('down')}
          aria-label="した"
        >▼</button>
        <span/>
      </div>
    </div>
  );
}
