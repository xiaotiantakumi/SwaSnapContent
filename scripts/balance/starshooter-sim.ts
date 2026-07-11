import {
  createGS,
  tick,
  type GS,
} from '../../app/sansu-100/games/logic/starshooter-logic';

const TRIALS = 2000;
const TICK_LIMIT = 20000;
const DELTA_MS = 16;

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

function randomMoveDir(botRng: () => number): number {
  const r = botRng();
  if (r < 1 / 3) return -1;
  if (r < 2 / 3) return 0;
  return 1;
}

function trackerMoveDir(gs: GS): number {
  if (gs.enemies.length === 0) return 0;
  let target = gs.enemies[0];
  for (const e of gs.enemies) {
    if (e.y > target.y) target = e;
  }
  const diff = target.x - gs.shipX;
  if (Math.abs(diff) <= 2) return 0;
  return diff > 0 ? 1 : -1;
}

type Strategy = 'random' | 'tracker';

interface TrialResult {
  score: number;
  ticks: number;
  hits: number;
  misses: number;
  overNaturally: boolean;
  hitTickLimit: boolean;
}

function runTrial(strategy: Strategy, seed: number): TrialResult {
  const gameRng = makeRng(seed);
  const botRng = makeRng(seed + 1_000_003);
  const gs = createGS();
  let hits = 0;
  let misses = 0;
  let ticks = 0;

  for (let t = 0; t < TICK_LIMIT && !gs.over; t++) {
    const moveDir =
      strategy === 'random' ? randomMoveDir(botRng) : trackerMoveDir(gs);
    tick(gs, DELTA_MS, moveDir, gameRng, (ev) => {
      if (ev === 'hit') hits++;
      if (ev === 'miss') misses++;
    });
    ticks++;
  }

  return {
    score: gs.score,
    ticks,
    hits,
    misses,
    overNaturally: gs.over,
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
  const hits = results.map((r) => r.hits);
  const misses = results.map((r) => r.misses);

  const overCount = results.filter((r) => r.overNaturally).length;
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
    avgHits: Math.round(avg(hits) * 10) / 10,
    avgMisses: Math.round(avg(misses) * 100) / 100,
  };
}

function main(): void {
  console.log(`Star Shooter balance sim – ${TRIALS} trials × 2 strategies (tick limit ${TICK_LIMIT})\n`);

  const strategies: Strategy[] = ['random', 'tracker'];
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
