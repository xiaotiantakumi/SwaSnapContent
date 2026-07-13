import {
  createBreakout,
  stepBreakout,
  BREAKOUT,
  type BreakoutState,
} from '../../app/sansu-100/lib/games/breakout';

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

type Strategy = 'random' | 'tracker';

interface BotParams {
  jitter: number;
  reactionDelay: number;
  randomHold: number;
}

function makeBotParams(botRng: () => number): BotParams {
  return {
    jitter: (botRng() - 0.5) * 24,
    reactionDelay: 2 + Math.floor(botRng() * 6),
    randomHold: 8 + Math.floor(botRng() * 20),
  };
}

function randomPaddleX(
  bot: BotParams,
  botRng: () => number,
  tick: number,
  targetRef: { value: number },
): number {
  if (tick % bot.randomHold === 0) {
    targetRef.value = botRng() * (BREAKOUT.w - BREAKOUT.paddleW);
  }
  return targetRef.value;
}

function trackerPaddleX(
  s: BreakoutState,
  bot: BotParams,
  tick: number,
  targetRef: { value: number },
): number {
  if (tick % bot.reactionDelay === 0) {
    targetRef.value = s.bx - BREAKOUT.paddleW / 2 + bot.jitter;
  }
  return targetRef.value;
}

interface TrialResult {
  score: number;
  ticks: number;
  overByDeath: boolean;
  hitTickLimit: boolean;
}

function runTrial(strategy: Strategy, seed: number): TrialResult {
  const botRng = makeRng(seed + 1_000_003);
  const bot = makeBotParams(botRng);
  let state = createBreakout();
  const targetRef = { value: state.paddleX };
  let ticks = 0;

  for (; ticks < TICK_LIMIT && !state.over; ticks++) {
    const paddleX =
      strategy === 'random'
        ? randomPaddleX(bot, botRng, ticks, targetRef)
        : trackerPaddleX(state, bot, ticks, targetRef);
    state = stepBreakout(state, paddleX);
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
    `Breakout balance sim – ${TRIALS} trials × 2 strategies (tick limit ${TICK_LIMIT})`,
  );
  console.log(
    `World: ${BREAKOUT.w}×${BREAKOUT.h}, bricks=${BREAKOUT.cols}×${BREAKOUT.rows}\n`,
  );

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
