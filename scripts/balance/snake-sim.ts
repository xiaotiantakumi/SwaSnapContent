import { createSnake, stepSnake, type SnakeState } from '../../app/sansu-100/lib/games/snake';
import { DIR_VECTORS, type Dir } from '../../app/sansu-100/lib/minigame-core';

const GRID = 15; // SnakeGame.tsx と同じ
const TRIALS = 2000;
const TICK_LIMIT = 20000;

const DIRS: Dir[] = ['up', 'down', 'left', 'right'];

const OPPOSITE: Record<Dir, Dir> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

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

function randomDir(botRng: () => number, current: Dir): Dir {
  const pool = DIRS.filter((d) => d !== OPPOSITE[current]);
  return pool[Math.floor(botRng() * pool.length)];
}

function greedyDir(s: SnakeState): Dir {
  const head = s.snake[0];
  const candidates = DIRS.filter((d) => d !== OPPOSITE[s.dir]);
  let best = candidates[0];
  let bestDist = Infinity;
  for (const d of candidates) {
    const v = DIR_VECTORS[d];
    const dist =
      Math.abs(head.x + v.x - s.food.x) + Math.abs(head.y + v.y - s.food.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  return best;
}

type Strategy = 'random' | 'greedy';

interface TrialResult {
  score: number;
  ticks: number;
  overByDeath: boolean;
  hitTickLimit: boolean;
}

function runTrial(strategy: Strategy, seed: number): TrialResult {
  const gameRng = makeRng(seed);
  const botRng = makeRng(seed + 1_000_003);
  let state = createSnake(GRID, gameRng);
  let ticks = 0;

  for (; ticks < TICK_LIMIT && !state.over; ticks++) {
    const requested =
      strategy === 'random' ? randomDir(botRng, state.dir) : greedyDir(state);
    state = stepSnake(state, requested, gameRng);
  }

  return {
    score: state.score,
    ticks,
    overByDeath: state.over,
    hitTickLimit: !state.over,
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
  };
}

function main(): void {
  console.log(
    `Snake balance sim – ${TRIALS} trials × 2 strategies (tick limit ${TICK_LIMIT})`,
  );
  console.log(`Grid: ${GRID}×${GRID}\n`);

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
