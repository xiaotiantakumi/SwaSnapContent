import {
  createGS,
  tick,
  PLAT_W,
  type GS,
} from '../../app/sansu-100/games/logic/ponpon-logic';

const TRIALS = 2000;
const TICK_LIMIT = 20000;
const TRACK_THRESHOLD = 2;

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
  const above = gs.platforms.filter((p) => p.y < gs.playerY);
  const target = above.length > 0
    ? above.reduce((best, p) => (p.y > best.y ? p : best))
    : gs.platforms.reduce((best, p) => (p.y < best.y ? p : best));
  const platCenter = target.x + PLAT_W / 2;
  const diff = platCenter - gs.playerX;
  if (Math.abs(diff) <= TRACK_THRESHOLD) return 0;
  return diff > 0 ? 1 : -1;
}

type Strategy = 'random' | 'tracker';

interface TrialResult {
  score: number;
  ticks: number;
  bounces: number;
  overNaturally: boolean;
  hitTickLimit: boolean;
}

function runTrial(strategy: Strategy, seed: number): TrialResult {
  const gameRng = makeRng(seed);
  const botRng = makeRng(seed + 1_000_003);
  const gs = createGS(gameRng);
  let bounces = 0;
  let ticks = 0;

  for (let t = 0; t < TICK_LIMIT && !gs.over; t++) {
    const moveDir =
      strategy === 'random' ? randomMoveDir(botRng) : trackerMoveDir(gs);
    tick(gs, moveDir, gameRng, (ev) => {
      if (ev === 'bounce') bounces++;
    });
    ticks++;
  }

  return {
    score: gs.maxHeight,
    ticks,
    bounces,
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
  const bounces = results.map((r) => r.bounces);

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
    avgBounces: Math.round(avg(bounces) * 10) / 10,
  };
}

function main(): void {
  console.log(`PonPon Jump balance sim – ${TRIALS} trials × 2 strategies (tick limit ${TICK_LIMIT})\n`);

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
