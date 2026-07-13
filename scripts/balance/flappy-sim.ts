import {
  createFlappy,
  stepFlappy,
  FLAPPY,
  type FlappyState,
} from '../../app/sansu-100/lib/games/flappy';

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

function nearestPipe(s: FlappyState) {
  const ahead = s.pipes
    .filter((p) => p.x + FLAPPY.pipeW >= FLAPPY.birdX - 10)
    .sort((a, b) => a.x - b.x);
  return ahead[0] ?? null;
}

function heuristicFlap(s: FlappyState): boolean {
  const pipe = nearestPipe(s);
  if (!pipe) return s.by > FLAPPY.h * 0.6;
  const gapCenter = pipe.gapY + FLAPPY.gapH / 2;
  return s.by > gapCenter;
}

type Strategy = 'random' | 'heuristic';

interface TrialResult {
  score: number;
  ticks: number;
  overByDeath: boolean;
  hitTickLimit: boolean;
}

function runTrial(strategy: Strategy, seed: number): TrialResult {
  const gameRng = makeRng(seed);
  const botRng = makeRng(seed + 1_000_003);
  let state = createFlappy(gameRng);
  let ticks = 0;

  for (; ticks < TICK_LIMIT && !state.over; ticks++) {
    const flap =
      strategy === 'random' ? botRng() < 0.5 : heuristicFlap(state);
    state = stepFlappy(state, flap, gameRng);
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
    `Flappy balance sim – ${TRIALS} trials × 2 strategies (tick limit ${TICK_LIMIT})`,
  );
  console.log(`World: ${FLAPPY.w}×${FLAPPY.h}, gapH=${FLAPPY.gapH}\n`);

  const strategies: Strategy[] = ['random', 'heuristic'];
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
