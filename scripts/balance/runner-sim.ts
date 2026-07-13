import {
  createRunner,
  stepRunner,
  RUNNER,
  type RunnerState,
} from '../../app/sansu-100/lib/games/runner';

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

function heuristicJump(s: RunnerState): boolean {
  if (!s.onGround) return false;
  const px = RUNNER.playerX;
  const threshold = 70;
  for (const o of s.obstacles) {
    if (o.x + o.w < px) continue;
    if (o.x > px + threshold) continue;
    if (s.py < o.h - 1) return true;
  }
  return false;
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
  let state = createRunner(gameRng);
  let ticks = 0;

  for (; ticks < TICK_LIMIT && !state.over; ticks++) {
    const jump =
      strategy === 'random'
        ? state.onGround && botRng() < 0.08
        : heuristicJump(state);
    state = stepRunner(state, jump, gameRng);
  }

  return {
    score: state.distance,
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
    `Runner balance sim – ${TRIALS} trials × 2 strategies (tick limit ${TICK_LIMIT})`,
  );
  console.log(
    `World: ${RUNNER.worldW}×${RUNNER.worldH}, baseSpeed=${RUNNER.baseSpeed}\n`,
  );

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
