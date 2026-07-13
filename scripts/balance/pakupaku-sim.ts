import {
  BASE_MAZE,
  COLS,
  ROWS,
  canPass,
  createGS,
  tickGame,
  DIRS,
  type Dir,
  type GS,
} from '../../app/sansu-100/games/logic/pakupaku-logic';
import { DIR_VECTORS } from '../../app/sansu-100/lib/minigame-core';

const TRIALS = 2000;
const TICK_LIMIT = 20000;

/** mulberry32 LCG – returns [0, 1) */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function idxToXY(idx: number): { x: number; y: number } {
  return { x: idx % COLS, y: Math.floor(idx / COLS) };
}

function bfsNextDir(
  sx: number,
  sy: number,
  targets: Set<number>,
): Dir | null {
  if (targets.size === 0) return null;

  const start = sy * COLS + sx;
  if (targets.has(start)) return null;

  const visited = new Uint8Array(COLS * ROWS);
  const prev = new Int16Array(COLS * ROWS).fill(-1);
  const queue: number[] = [start];
  visited[start] = 1;

  let found = -1;
  while (queue.length > 0) {
    const cur = queue.shift();
    if (cur === undefined) break;
    if (targets.has(cur)) {
      found = cur;
      break;
    }
    const { x, y } = idxToXY(cur);
    for (const d of DIRS) {
      const v = DIR_VECTORS[d];
      const nx = x + v.x;
      const ny = y + v.y;
      if (!canPass(nx, ny, false)) continue;
      const ni = ny * COLS + nx;
      if (visited[ni]) continue;
      visited[ni] = 1;
      prev[ni] = cur;
      queue.push(ni);
    }
  }

  if (found < 0) return null;

  let step = found;
  while (prev[step] >= 0 && prev[step] !== start) {
    step = prev[step];
  }
  if (prev[step] < 0) return null;

  const { x: fx, y: fy } = idxToXY(step);
  const dx = fx - sx;
  const dy = fy - sy;
  if (dx === 1) return 'right';
  if (dx === -1) return 'left';
  if (dy === 1) return 'down';
  if (dy === -1) return 'up';
  return null;
}

function adjacentThreat(gs: GS): Dir | null {
  const { x: px, y: py } = gs.player;
  for (const g of gs.ghosts) {
    if (g.mode === 'scared' || g.mode === 'dead' || g.mode === 'house') continue;
    const dx = g.x - px;
    const dy = g.y - py;
    if (Math.abs(dx) + Math.abs(dy) !== 1) continue;
    if (dx === 1) return 'left';
    if (dx === -1) return 'right';
    if (dy === 1) return 'up';
    if (dy === -1) return 'down';
  }
  return null;
}

function fleeDir(gs: GS, threat: Dir): Dir | null {
  const { x, y } = gs.player;
  const candidates = DIRS.filter((d) => {
    const v = DIR_VECTORS[d];
    return canPass(x + v.x, y + v.y, false);
  });
  if (candidates.length === 0) return null;
  const away = candidates.filter((d) => d !== threat);
  const pool = away.length > 0 ? away : candidates;
  return pool[0];
}

function randomBotDir(botRng: () => number): Dir {
  return DIRS[Math.floor(botRng() * DIRS.length)];
}

function greedyBotDir(gs: GS): Dir | null {
  const threat = adjacentThreat(gs);
  if (threat) {
    const flee = fleeDir(gs, threat);
    if (flee) return flee;
  }

  const targets = new Set<number>([...gs.dots, ...gs.powers]);
  const toward = bfsNextDir(gs.player.x, gs.player.y, targets);
  if (toward) return toward;

  // fallback: any passable direction
  const { x, y } = gs.player;
  for (const d of DIRS) {
    const v = DIR_VECTORS[d];
    if (canPass(x + v.x, y + v.y, false)) return d;
  }
  return null;
}

type Strategy = 'random' | 'greedy';

interface TrialResult {
  score: number;
  ticks: number;
  deaths: number;
  overByDeath: boolean;
  hitTickLimit: boolean;
}

function runTrial(strategy: Strategy, seed: number): TrialResult {
  const ghostRng = makeRng(seed);
  const botRng = makeRng(seed + 1_000_003);
  const gs = createGS();
  let deaths = 0;

  for (let t = 0; t < TICK_LIMIT && !gs.over; t++) {
    const heldDir =
      strategy === 'random'
        ? randomBotDir(botRng)
        : greedyBotDir(gs);

    tickGame(gs, heldDir, ghostRng, (ev) => {
      if (ev === 'die') deaths++;
    });
  }

  return {
    score: gs.score,
    ticks: gs.tick,
    deaths,
    overByDeath: gs.over,
    hitTickLimit: !gs.over,
  };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function summarize(strategy: Strategy, results: TrialResult[]) {
  const scores = results.map((r) => r.score).sort((a, b) => a - b);
  const ticks = results.map((r) => r.ticks);
  const deaths = results.map((r) => r.deaths);

  const overCount = results.filter((r) => r.overByDeath).length;
  const limitCount = results.filter((r) => r.hitTickLimit).length;

  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;

  return {
    strategy,
    trials: results.length,
    avgScore: Math.round(avg(scores) * 10) / 10,
    medianScore: percentile(scores, 0.5),
    p25Score: percentile(scores, 0.25),
    p75Score: percentile(scores, 0.75),
    minScore: scores[0] ?? 0,
    maxScore: scores[scores.length - 1] ?? 0,
    avgTicks: Math.round(avg(ticks) * 10) / 10,
    overRate: `${((overCount / results.length) * 100).toFixed(1)}%`,
    tickLimitRate: `${((limitCount / results.length) * 100).toFixed(1)}%`,
    avgDeaths: Math.round(avg(deaths) * 100) / 100,
  };
}

function main(): void {
  console.log(`Pakupaku balance sim – ${TRIALS} trials × 2 strategies (tick limit ${TICK_LIMIT})`);
  console.log(`Maze: ${COLS}×${ROWS}, cells=${BASE_MAZE.length}\n`);

  const strategies: Strategy[] = ['random', 'greedy'];
  const rows = strategies.map((s) => {
    const results: TrialResult[] = [];
    for (let i = 0; i < TRIALS; i++) {
      results.push(runTrial(s, 42_000 + i * 9973));
    }
    return summarize(s, results);
  });

  console.table(rows);
}

main();
