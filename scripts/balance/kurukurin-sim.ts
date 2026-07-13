import { createGS, tick, type GS } from '../../app/sansu-100/games/logic/kurukurin-logic';
import { N, E, S, W, type MazeState } from '../../app/sansu-100/lib/games/maze';

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

const MAZE_DIRS = [
  { dx: 0, dy: -1, bit: N, tiltX: 0, tiltY: -1 },
  { dx: 1, dy: 0, bit: E, tiltX: 1, tiltY: 0 },
  { dx: 0, dy: 1, bit: S, tiltX: 0, tiltY: 1 },
  { dx: -1, dy: 0, bit: W, tiltX: -1, tiltY: 0 },
] as const;

function canPassMaze(m: MazeState, x: number, y: number, bit: number, nx: number, ny: number): boolean {
  if (nx < 0 || ny < 0 || nx >= m.cols || ny >= m.rows) return false;
  return (m.cells[y * m.cols + x] & bit) !== 0;
}

function steerTowardGoalCenter(gs: GS): { tiltX: number; tiltY: number } {
  const gcx = gs.maze.gx + 0.5;
  const gcy = gs.maze.gy + 0.5;
  const dx = gcx - gs.bx;
  const dy = gcy - gs.by;
  return {
    tiltX: dx > 0.05 ? 1 : dx < -0.05 ? -1 : 0,
    tiltY: dy > 0.05 ? 1 : dy < -0.05 ? -1 : 0,
  };
}

function pathfinderTilt(gs: GS): { tiltX: number; tiltY: number } {
  const m = gs.maze;
  const sx = Math.floor(gs.bx);
  const sy = Math.floor(gs.by);
  const gx = m.gx;
  const gy = m.gy;

  if (sx === gx && sy === gy) {
    return steerTowardGoalCenter(gs);
  }

  const cols = m.cols;
  const start = sy * cols + sx;
  const goal = gy * cols + gx;

  const visited = new Uint8Array(cols * m.rows);
  const prev = new Int16Array(cols * m.rows).fill(-1);
  const queue: number[] = [start];
  visited[start] = 1;

  let found = -1;
  while (queue.length > 0) {
    const cur = queue.shift();
    if (cur === undefined) break;
    if (cur === goal) {
      found = cur;
      break;
    }
    const cx = cur % cols;
    const cy = Math.floor(cur / cols);
    for (const d of MAZE_DIRS) {
      const nx = cx + d.dx;
      const ny = cy + d.dy;
      if (!canPassMaze(m, cx, cy, d.bit, nx, ny)) continue;
      const ni = ny * cols + nx;
      if (visited[ni]) continue;
      visited[ni] = 1;
      prev[ni] = cur;
      queue.push(ni);
    }
  }

  if (found < 0) {
    return steerTowardGoalCenter(gs);
  }

  let step = found;
  while (prev[step] >= 0 && prev[step] !== start) {
    step = prev[step];
  }
  if (prev[step] < 0) {
    return steerTowardGoalCenter(gs);
  }

  const fx = step % cols;
  const fy = Math.floor(step / cols);
  const dx = fx - sx;
  const dy = fy - sy;
  if (dx === 1) return { tiltX: 1, tiltY: 0 };
  if (dx === -1) return { tiltX: -1, tiltY: 0 };
  if (dy === 1) return { tiltX: 0, tiltY: 1 };
  if (dy === -1) return { tiltX: 0, tiltY: -1 };
  return { tiltX: 0, tiltY: 0 };
}

function randomTilt(botRng: () => number): { tiltX: number; tiltY: number } {
  return { tiltX: botRng() * 2 - 1, tiltY: botRng() * 2 - 1 };
}

type Strategy = 'random' | 'pathfinder';

interface TrialResult {
  score: number;
  ticks: number;
  goals: number;
  overNatural: boolean;
  hitTickLimit: boolean;
}

function runTrial(strategy: Strategy, seed: number): TrialResult {
  const gameRng = makeRng(seed);
  const botRng = makeRng(seed + 1_000_003);
  const gs = createGS(gameRng, 1);
  let goals = 0;
  let ticks = 0;

  for (let t = 0; t < TICK_LIMIT && !gs.over; t++) {
    const { tiltX, tiltY } =
      strategy === 'random' ? randomTilt(botRng) : pathfinderTilt(gs);

    tick(gs, tiltX, tiltY, gameRng, (ev) => {
      if (ev === 'goal') goals++;
    });
    ticks++;
  }

  return {
    score: gs.cleared,
    ticks,
    goals,
    overNatural: gs.over,
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
  const cleared = results.map((r) => r.score).sort((a, b) => a - b);
  const ticks = results.map((r) => r.ticks);
  const goals = results.map((r) => r.goals);

  const overCount = results.filter((r) => r.overNatural).length;
  const limitCount = results.filter((r) => r.hitTickLimit).length;

  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;

  return {
    strategy,
    trials: results.length,
    avgCleared: Math.round(avg(cleared) * 10) / 10,
    medianCleared: percentile(cleared, 0.5),
    p25: percentile(cleared, 0.25),
    p75: percentile(cleared, 0.75),
    min: cleared[0] ?? 0,
    max: cleared[cleared.length - 1] ?? 0,
    avgTicks: Math.round(avg(ticks) * 10) / 10,
    overRate: `${((overCount / results.length) * 100).toFixed(1)}%`,
    tickLimitRate: `${((limitCount / results.length) * 100).toFixed(1)}%`,
    avgGoals: Math.round(avg(goals) * 100) / 100,
  };
}

function main(): void {
  console.log(`Kurukurin balance sim – ${TRIALS} trials × 2 strategies (tick limit ${TICK_LIMIT})\n`);

  const strategies: Strategy[] = ['random', 'pathfinder'];
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
