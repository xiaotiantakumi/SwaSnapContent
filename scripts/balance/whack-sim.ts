import {
  createWhack,
  stepWhack,
  hitHole,
  WHACK,
  type WhackState,
} from '../../app/sansu-100/lib/games/whack';

const TRIALS = 2000;
const TICK_LIMIT = WHACK.totalTicks + 20;

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

function randomHitIndex(botRng: () => number): number {
  return Math.floor(botRng() * WHACK.holes);
}

function smartHitIndex(s: WhackState): number | null {
  for (let i = 0; i < s.holes.length; i++) {
    const m = s.holes[i];
    if (m.active && !m.isBad) return i;
  }
  return null;
}

type Strategy = 'random' | 'smart';

interface TrialResult {
  score: number;
  ticks: number;
  overByDeath: boolean;
  hitTickLimit: boolean;
}

function runTrial(strategy: Strategy, seed: number): TrialResult {
  const gameRng = makeRng(seed);
  const botRng = makeRng(seed + 1_000_003);
  let state = createWhack();
  let ticks = 0;

  for (; ticks < TICK_LIMIT && !state.over; ticks++) {
    state = stepWhack(state, gameRng);
    if (state.over) break;

    if (strategy === 'random') {
      state = hitHole(state, randomHitIndex(botRng));
    } else {
      const idx = smartHitIndex(state);
      if (idx !== null) state = hitHole(state, idx);
    }
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
    `Whack balance sim – ${TRIALS} trials × 2 strategies (tick limit ${TICK_LIMIT})`,
  );
  console.log(`Holes: ${WHACK.holes}, totalTicks=${WHACK.totalTicks}\n`);

  const strategies: Strategy[] = ['random', 'smart'];
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
