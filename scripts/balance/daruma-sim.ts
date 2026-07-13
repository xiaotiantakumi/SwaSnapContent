import {
  createDarumaGS,
  stepDaruma,
  TICK_MS,
  type DarumaEvent,
  type DarumaGS,
} from '../../app/sansu-100/games/logic/daruma-logic';

const TRIALS = 2000;
const MAX_TICKS = 20_000;

/** mulberry32 – returns [0, 1) */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Strategy = 'greedy' | 'cautious' | 'reactive';

interface TrialStats {
  score: number;
  round: number;
  banks: number;
  caughts: number;
  clears: number;
  dangerMultSum: number;
  dangerMultCount: number;
  ticks: number;
  maxTicksHit: boolean;
}

interface BotState {
  turnStartTick: number;
  reaction: number;
  idleChance: number;
}

function planBot(strategy: Strategy): BotState {
  switch (strategy) {
    case 'greedy':
      return { turnStartTick: -1, reaction: 0, idleChance: 0.05 };
    case 'cautious':
      return { turnStartTick: -1, reaction: 0, idleChance: 0.02 };
    case 'reactive':
      return { turnStartTick: -1, reaction: 0, idleChance: 0.02 };
  }
}

function sampleReaction(strategy: Strategy, graceTicks: number, rng: () => number): number {
  switch (strategy) {
    case 'greedy': {
      const base = graceTicks + 1;
      const jitter = Math.floor(rng() * 3) - 1;
      return Math.max(0, base + jitter);
    }
    case 'reactive': {
      const base = graceTicks;
      const jitter = Math.floor(rng() * 3) - 1;
      return Math.max(0, base + jitter);
    }
    case 'cautious':
      return 0;
  }
}

function ensureTurnReaction(
  gs: DarumaGS,
  strategy: Strategy,
  bot: BotState,
  rng: () => number
): void {
  if (gs.phase === 'turn' && gs.turnStartTick !== bot.turnStartTick) {
    bot.turnStartTick = gs.turnStartTick;
    bot.reaction = sampleReaction(strategy, gs.oni.graceTicks, rng);
  }
}

function botTaps(gs: DarumaGS, strategy: Strategy, bot: BotState, rng: () => number): number {
  if (gs.over) return 0;

  if (bot.idleChance > 0 && rng() < bot.idleChance) return 0;

  switch (gs.phase) {
    case 'chant':
      return 1 + Math.floor(rng() * 2);
    case 'tell':
      if (strategy === 'cautious') return 0;
      if (strategy === 'greedy') return 1 + Math.floor(rng() * 2);
      if (strategy === 'reactive') return rng() < 0.5 ? 1 + Math.floor(rng() * 2) : 0;
      return 0;
    case 'turn': {
      if (strategy === 'cautious') return 0;
      ensureTurnReaction(gs, strategy, bot, rng);
      const turnAge = gs.tickCount - gs.turnStartTick;
      if (turnAge <= bot.reaction) {
        return 1;
      }
      return 0;
    }
    default:
      return 0;
  }
}

function runTrial(strategy: Strategy, seed: number): TrialStats {
  const gameRng = makeRng(seed);
  const botRng = makeRng(seed ^ 0xdeadbeef);
  const bot = planBot(strategy);
  const gs = createDarumaGS(gameRng);

  let banks = 0;
  let caughts = 0;
  let clears = 0;
  let dangerMultSum = 0;
  let dangerMultCount = 0;
  let ticks = 0;
  let maxTicksHit = false;

  for (let t = 0; t < MAX_TICKS && !gs.over; t++) {
    const taps = botTaps(gs, strategy, bot, botRng);
    stepDaruma(gs, taps, gameRng, (ev: DarumaEvent) => {
      if (ev === 'bank') {
        banks++;
        dangerMultSum += gs.lastDangerMult;
        dangerMultCount++;
      }
      if (ev === 'caught') caughts++;
      if (ev === 'clear') clears++;
    });
    ticks++;
  }

  if (!gs.over) {
    maxTicksHit = true;
  }

  return {
    score: gs.score,
    round: gs.round,
    banks,
    caughts,
    clears,
    dangerMultSum,
    dangerMultCount,
    ticks,
    maxTicksHit,
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

function avg(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function summarize(strategy: Strategy, results: TrialStats[]) {
  const scores = results.map((r) => r.score).sort((a, b) => a - b);
  const rounds = results.map((r) => r.round);
  const banks = results.map((r) => r.banks);
  const caughts = results.map((r) => r.caughts);
  const clears = results.map((r) => r.clears);
  const ticks = results.map((r) => r.ticks);
  const maxTicksHits = results.filter((r) => r.maxTicksHit).length;
  const dangerAvgs = results.map((r) =>
    r.dangerMultCount > 0 ? r.dangerMultSum / r.dangerMultCount : 0
  );

  return {
    strategy,
    avgScore: Math.round(avg(scores)),
    medianScore: Math.round(percentile(scores, 0.5)),
    p25: Math.round(percentile(scores, 0.25)),
    p75: Math.round(percentile(scores, 0.75)),
    avgRound: Math.round(avg(rounds) * 10) / 10,
    avgBanks: Math.round(avg(banks) * 10) / 10,
    avgCaughts: Math.round(avg(caughts) * 10) / 10,
    avgClears: Math.round(avg(clears) * 100) / 100,
    avgDangerMult: Math.round(avg(dangerAvgs) * 100) / 100,
    avgTicks: Math.round(avg(ticks)),
    avgSurvivalSec: Math.round((avg(ticks) * TICK_MS) / 100) / 10,
    maxTicksHitRate: Math.round((maxTicksHits / results.length) * 1000) / 10,
  };
}

function runStrategy(strategy: Strategy): TrialStats[] {
  const results: TrialStats[] = [];
  for (let i = 0; i < TRIALS; i++) {
    results.push(runTrial(strategy, 77_000 + i * 7919));
  }
  return results;
}

function main(): void {
  console.log(`Daruma balance sim – ${TRIALS} trials × 3 strategies\n`);

  const strategies: Strategy[] = ['greedy', 'cautious', 'reactive'];
  const rows = strategies.map((s) => summarize(s, runStrategy(s)));
  console.table(rows);
}

main();
