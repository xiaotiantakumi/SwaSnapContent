'use client';
// パクパクおじさん（ドットイート）
// 独自要素:
//   背後ステルス - 弱った敵は正面から当たると死ぬ。横・後ろから接触したときだけ倒せる

import React, { useEffect, useRef, useState } from 'react';

import {
  DIR_VECTORS,
  dirFromKey,
  startGameLoop,
  type Dir,
} from '../lib/minigame-core';
import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

// ── Maze (17×15) ────────────────────────────────────────────────────────
// 0=ドット  1=壁  2=パワー餌  3=空(ドットなし)  4=ゴーストの家
const COLS = 17;
const ROWS = 15;
const BASE_MAZE: readonly number[] = [
  /* 0 */ 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  /* 1 */ 1,0,0,0,1,0,0,0,3,0,0,0,1,0,0,0,1,
  /* 2 */ 1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,
  /* 3 */ 1,2,1,0,0,0,1,0,0,0,1,0,0,0,1,2,1,
  /* 4 */ 1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,
  /* 5 */ 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
  /* 6 */ 1,0,1,1,1,0,1,4,4,4,1,0,1,1,1,0,1,
  /* 7 */ 1,0,0,0,1,0,1,4,4,4,1,0,1,0,0,0,1,
  /* 8 */ 1,0,1,1,1,0,1,4,4,4,1,0,1,1,1,0,1,
  /* 9 */ 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
  /*10 */ 1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,
  /*11 */ 1,2,1,0,0,0,1,0,0,0,1,0,0,0,1,2,1,
  /*12 */ 1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,
  /*13 */ 1,0,0,0,1,0,0,0,3,0,0,0,1,0,0,0,1,
  /*14 */ 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
];

// ── Types ────────────────────────────────────────────────────────────────
type GhostMode = 'house' | 'exiting' | 'chase' | 'scared' | 'dead';

interface Ghost {
  x: number;
  y: number;
  dir: Dir;
  mode: GhostMode;
  color: string;
  scaredTicks: number;
  stepAt: number;
  exitDelay: number;
}

interface GS {
  player: {
    x: number; y: number; dir: Dir; nextDir: Dir;
    stepAt: number;
    dead: boolean;
    respawnAt: number;
    invincibleUntil: number;
  };
  ghosts: Ghost[];
  dots: Set<number>;
  powers: Set<number>;
  score: number;
  combo: number;
  lives: number;
  tick: number;
  over: boolean;
  soundOn: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────
const PLAYER_START = { x: 8, y: 13 };
const GHOST_HOME = { x: 8, y: 7 };
const GHOST_EXIT = { x: 8, y: 5 };
const DIRS: readonly Dir[] = ['up', 'down', 'left', 'right'];
const OPP: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

const PLAYER_TICKS = 2;          // 200ms（常に一定）
const GHOST_TICKS_CHASE   = 3;   // 300ms
const GHOST_TICKS_SCARED  = 5;   // 500ms
const GHOST_TICKS_DEAD    = 1;   // 100ms (rush back)
const SCARED_DURATION     = 100; // ticks (~10s)

// ── Maze helpers ─────────────────────────────────────────────────────────
function cellAt(x: number, y: number): number {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return 1;
  return BASE_MAZE[y * COLS + x];
}

function canPass(x: number, y: number, isGhost: boolean): boolean {
  const c = cellAt(x, y);
  if (c === 1) return false;
  if (c === 4) return isGhost;
  return true;
}

function freeNeighbors(x: number, y: number, isGhost: boolean, exclude?: Dir): Dir[] {
  return DIRS.filter((d) => {
    if (d === exclude) return false;
    const v = DIR_VECTORS[d];
    return canPass(x + v.x, y + v.y, isGhost);
  });
}

function bestDir(
  gx: number, gy: number,
  tx: number, ty: number,
  curDir: Dir,
  isGhost: boolean,
  invert = false,
  rand: () => number,
): Dir {
  const free = freeNeighbors(gx, gy, isGhost, OPP[curDir]);
  const pool = free.length > 0 ? free : freeNeighbors(gx, gy, isGhost);
  if (pool.length === 0) return curDir;
  const distSq = (d: Dir) => {
    const v = DIR_VECTORS[d];
    return (gx + v.x - tx) ** 2 + (gy + v.y - ty) ** 2;
  };
  if (invert) {
    return pool.reduce((b, d) => distSq(d) > distSq(b) ? d : b, pool[0]);
  }
  // Add small random chance to avoid perfectly deterministic chase
  if (rand() < 0.15 && pool.length > 1) return pool[Math.floor(rand() * pool.length)];
  return pool.reduce((b, d) => distSq(d) < distSq(b) ? d : b, pool[0]);
}

// ── Initial state ─────────────────────────────────────────────────────────
function makeDots(): { dots: Set<number>; powers: Set<number> } {
  const dots = new Set<number>();
  const powers = new Set<number>();
  BASE_MAZE.forEach((c, i) => {
    if (c === 0) dots.add(i);
    else if (c === 2) powers.add(i);
  });
  return { dots, powers };
}

function createGS(): GS {
  const { dots, powers } = makeDots();
  return {
    player: {
      x: PLAYER_START.x, y: PLAYER_START.y,
      dir: 'left', nextDir: 'left',
      stepAt: 5, dead: false, respawnAt: -1, invincibleUntil: -1,
    },
    ghosts: [
      { x: 8, y: 7, dir: 'up', mode: 'house', color: '#ff4444', scaredTicks: 0, stepAt: 0, exitDelay: 0 },
      { x: 7, y: 7, dir: 'up', mode: 'house', color: '#ffaaff', scaredTicks: 0, stepAt: 0, exitDelay: 25 },
      { x: 9, y: 7, dir: 'up', mode: 'house', color: '#44ffff', scaredTicks: 0, stepAt: 0, exitDelay: 50 },
    ],
    dots, powers,
    score: 0,
    combo: 0,
    lives: 3,
    tick: 0,
    over: false,
    soundOn: storage.getSettings().soundOn,
  };
}

// ── Game tick ─────────────────────────────────────────────────────────────
function tickGame(
  gs: GS,
  rand: () => number,
  onEvent: (ev: 'dot' | 'power' | 'kill' | 'die') => void,
): void {
  if (gs.over) return;
  gs.tick++;

  // Respawn player
  if (gs.player.dead && !gs.over && gs.tick >= gs.player.respawnAt) {
    gs.player.x = PLAYER_START.x;
    gs.player.y = PLAYER_START.y;
    gs.player.dir = 'left';
    gs.player.nextDir = 'left';
    gs.player.dead = false;
    gs.player.stepAt = gs.tick + 8;
    gs.player.invincibleUntil = gs.tick + 60; // 6秒間無敵
  }

  // Move player
  if (!gs.player.dead && gs.tick >= gs.player.stepAt) {
    const { x, y, dir, nextDir } = gs.player;

    let moveDir = dir;
    if (nextDir !== dir) {
      const v = DIR_VECTORS[nextDir];
      if (canPass(x + v.x, y + v.y, false)) moveDir = nextDir;
    }

    const v = DIR_VECTORS[moveDir];
    const nx = x + v.x;
    const ny = y + v.y;
    if (canPass(nx, ny, false)) {
      gs.player.x = nx;
      gs.player.y = ny;
      gs.player.dir = moveDir;
      const idx = ny * COLS + nx;

      if (gs.dots.has(idx)) {
        gs.dots.delete(idx);
        gs.score += 10;
        onEvent('dot');
        if (gs.dots.size === 0 && gs.powers.size === 0) {
          const r = makeDots();
          gs.dots = r.dots;
          gs.powers = r.powers;
        }
      }
      if (gs.powers.has(idx)) {
        gs.powers.delete(idx);
        gs.score += 50;
        gs.combo = 0;
        gs.ghosts.forEach((g) => {
          if (g.mode === 'chase' || g.mode === 'exiting') {
            g.mode = 'scared';
            g.scaredTicks = SCARED_DURATION;
          }
        });
        onEvent('power');
      }
    }
    gs.player.stepAt = gs.tick + PLAYER_TICKS;
  }

  // Move ghosts
  for (const g of gs.ghosts) {
    if (gs.tick < g.stepAt) continue;
    const allowHouse = g.mode === 'house' || g.mode === 'exiting' || g.mode === 'dead';

    let newDir = g.dir;
    if (g.mode === 'house') {
      if (g.exitDelay > 0) {
        g.exitDelay--;
        g.stepAt = gs.tick + 4;
        continue;
      }
      g.mode = 'exiting';
    }
    if (g.mode === 'exiting') {
      newDir = bestDir(g.x, g.y, GHOST_EXIT.x, GHOST_EXIT.y, g.dir, true, false, rand);
      if (g.x === GHOST_EXIT.x && g.y === GHOST_EXIT.y) g.mode = 'chase';
    } else if (g.mode === 'chase') {
      newDir = bestDir(g.x, g.y, gs.player.x, gs.player.y, g.dir, false, false, rand);
    } else if (g.mode === 'scared') {
      g.scaredTicks--;
      if (g.scaredTicks <= 0) { g.mode = 'chase'; }
      else {
        newDir = bestDir(g.x, g.y, gs.player.x, gs.player.y, g.dir, false, true, rand);
      }
    } else if (g.mode === 'dead') {
      newDir = bestDir(g.x, g.y, GHOST_HOME.x, GHOST_HOME.y, g.dir, true, false, rand);
      if (g.x === GHOST_HOME.x && g.y === GHOST_HOME.y) {
        g.mode = 'house';
        g.exitDelay = 35;
        g.scaredTicks = 0;
      }
    }

    const v = DIR_VECTORS[newDir];
    const nx = g.x + v.x;
    const ny = g.y + v.y;
    if (canPass(nx, ny, allowHouse)) {
      g.x = nx; g.y = ny; g.dir = newDir;
    } else {
      // Try current direction
      const cv = DIR_VECTORS[g.dir];
      const cnx = g.x + cv.x;
      const cny = g.y + cv.y;
      if (canPass(cnx, cny, allowHouse)) { g.x = cnx; g.y = cny; }
    }

    g.stepAt = gs.tick + (
      g.mode === 'scared' ? GHOST_TICKS_SCARED :
      g.mode === 'dead'   ? GHOST_TICKS_DEAD   : GHOST_TICKS_CHASE
    );
  }

  // Collision detection (スキップ: 無敵中)
  if (!gs.player.dead && gs.tick >= gs.player.invincibleUntil) {
    const { x: px, y: py, dir: pd } = gs.player;
    for (const g of gs.ghosts) {
      if (g.x !== px || g.y !== py) continue;
      if (g.mode === 'scared') {
        // 正面衝突（プレイヤーとゴーストが真向かい）のみ死亡。横・後ろからは倒せる。
        if (pd === OPP[g.dir]) {
          killPlayer(gs, onEvent);
          break;
        } else {
          gs.score += 200 * (1 << Math.min(gs.combo, 4));
          gs.combo++;
          g.mode = 'dead';
          g.scaredTicks = 0;
          onEvent('kill');
        }
      } else if (g.mode === 'chase' || g.mode === 'exiting') {
        killPlayer(gs, onEvent);
        break;
      }
    }
  }
}

function killPlayer(gs: GS, onEvent: (ev: 'die') => void): void {
  gs.lives--;
  gs.player.dead = true;
  gs.player.respawnAt = gs.tick + 60; // 6秒後にリスポーン
  gs.combo = 0;
  // ゴーストを全員Houseに戻して時間差で再登場（スポーン地点での即死防止）
  gs.ghosts.forEach((g, i) => {
    if (g.mode !== 'dead') {
      g.mode = 'house';
      g.x = GHOST_HOME.x;
      g.y = GHOST_HOME.y;
      g.exitDelay = 30 + i * 25;
      g.scaredTicks = 0;
    }
  });
  if (gs.lives <= 0) gs.over = true;
  onEvent('die');
}

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
    const { x: px, y: py, dir } = gs.player;
    const pcx = px * cell + cell / 2;
    const pcy = py * cell + cell / 2;
    const pr = cell * 0.42;
    const mouthOpen = 0.22 + Math.abs(Math.sin(gs.tick * 0.5)) * 0.18;
    const base = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[dir];
    ctx.fillStyle = '#ffee00';
    ctx.beginPath();
    ctx.moveTo(pcx, pcy);
    ctx.arc(pcx, pcy, pr, base + mouthOpen, base + Math.PI * 2 - mouthOpen);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#cc8800';
    ctx.beginPath();
    ctx.arc(pcx, pcy, pr * 0.25, 0, Math.PI * 2);
    ctx.fill();
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

    const gs = createGS();
    gsRef.current = gs;
    overRef.current = false;

    const rng = Math.random.bind(Math);
    let prevScore = 0;

    const handle = startGameLoop({
      stepMs: () => 100,
      onTick: () => {
        if (overRef.current) return;
        tickGame(gs, rng, (ev) => {
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

    const onKey = (e: KeyboardEvent) => {
      const d = dirFromKey(e.key);
      if (d) { gsRef.current.player.nextDir = d; e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      handle.stop();
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDir = (d: Dir) => { gsRef.current.player.nextDir = d; };

  const touch = useRef<{ x: number; y: number } | null>(null);
  const padBtn = 'flex h-12 w-12 items-center justify-center rounded-xl bg-gray-200 text-xl font-bold text-gray-700 active:bg-gray-300 dark:bg-gray-700 dark:text-gray-200';

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
        onPointerUp={(e) => {
          const s0 = touch.current; touch.current = null;
          if (!s0) return;
          const dx = e.clientX - s0.x, dy = e.clientY - s0.y;
          if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
          setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
        }}
      />

      <p className="text-xs text-gray-500 dark:text-gray-400">
        パワー餌◎を たべると てきが よわる。よこ か うしろから のみこもう！
      </p>

      {/* Direction pad */}
      <div className="grid grid-cols-3 gap-2" aria-label="そうさボタン">
        <span/>
        <button type="button" className={padBtn} onClick={() => setDir('up')} aria-label="うえ">▲</button>
        <span/>
        <button type="button" className={padBtn} onClick={() => setDir('left')} aria-label="ひだり">◀</button>
        <span/>
        <button type="button" className={padBtn} onClick={() => setDir('right')} aria-label="みぎ">▶</button>
        <span/>
        <button type="button" className={padBtn} onClick={() => setDir('down')} aria-label="した">▼</button>
        <span/>
      </div>
    </div>
  );
}
