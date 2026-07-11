import {
  createRhythmGS,
  stepRhythm,
  tapRhythm,
  DEFAULT_RHYTHM_CONFIG,
  TICK_MS,
  type RhythmGS,
  type RhythmConfig,
} from '../../app/sansu-100/games/logic/rhythmdon-logic';

const TRIALS = 2000;
const HUMAN_SIGMA_MS = 130;

/** mulberry32 LCG – returns [0, 1) */
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

function gaussian(rng: () => number): number {
  const u1 = rng();
  const u2 = rng();
  if (u1 <= Number.EPSILON) return gaussian(rng);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

type Strategy = 'perfect' | 'human';

interface TrialResult {
  score: number;
  misses: number;
  overByLives: boolean;
  ticks: number;
  spawnCount: number;
}

function runPerfectBot(gs: RhythmGS, elapsed: number, cfg: RhythmConfig): void {
  const tappedThisTick = new Set<number>();
  for (const lane of Array.from({ length: cfg.lanes }, (_, i) => i)) {
    for (const n of gs.notes) {
      if (n.lane !== lane || n.resolved || tappedThisTick.has(n.id)) continue;
      const age = elapsed - n.spawnedAt;
      if (age >= cfg.noteTravelMs) {
        tapRhythm(gs, lane, elapsed, cfg, () => {});
        tappedThisTick.add(n.id);
      }
    }
  }
}

function runHumanBot(
  gs: RhythmGS,
  elapsed: number,
  cfg: RhythmConfig,
  notePlans: Map<number, { err: number; tapped: boolean }>,
  rng: () => number
): void {
  for (const n of gs.notes) {
    if (!notePlans.has(n.id)) {
      notePlans.set(n.id, { err: gaussian(rng) * HUMAN_SIGMA_MS, tapped: false });
    }
  }

  for (const lane of Array.from({ length: cfg.lanes }, (_, i) => i)) {
    for (const n of gs.notes) {
      if (n.lane !== lane || n.resolved) continue;
      const plan = notePlans.get(n.id);
      if (!plan || plan.tapped) continue;
      const age = elapsed - n.spawnedAt;
      if (age >= cfg.noteTravelMs + plan.err) {
        tapRhythm(gs, lane, elapsed, cfg, () => {});
        plan.tapped = true;
      }
    }
  }
}

function runTrial(strategy: Strategy, seed: number, cfg: RhythmConfig): TrialResult {
  const botRng = makeRng(seed);
  const gs = createRhythmGS(cfg);
  const notePlans = new Map<number, { err: number; tapped: boolean }>();
  let misses = 0;
  let ticks = 0;

  for (let elapsed = 0; elapsed <= cfg.gameDurationMs; elapsed += TICK_MS) {
    if (gs.over) break;

    if (strategy === 'perfect') {
      runPerfectBot(gs, elapsed, cfg);
    } else {
      runHumanBot(gs, elapsed, cfg, notePlans, botRng);
    }

    stepRhythm(gs, elapsed, cfg, (ev) => {
      if (ev === 'miss') misses++;
    });
    ticks++;

    if (gs.over) break;
  }

  const spawnCount = gs.nextSpawnIdx;
  const overByLives = gs.over && ticks * TICK_MS < cfg.gameDurationMs && gs.lives <= 0;

  return {
    score: gs.score,
    misses,
    overByLives,
    ticks,
    spawnCount,
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

function summarize(strategy: Strategy, results: TrialResult[]) {
  const scores = results.map((r) => r.score).sort((a, b) => a - b);
  const misses = results.map((r) => r.misses);
  const ticks = results.map((r) => r.ticks);
  const hitRates = results.map((r) => (r.spawnCount > 0 ? r.score / r.spawnCount : 0));
  const overCount = results.filter((r) => r.overByLives).length;

  return {
    strategy,
    avgScore: Math.round(avg(scores) * 10) / 10,
    medianScore: percentile(scores, 0.5),
    p25: percentile(scores, 0.25),
    p75: percentile(scores, 0.75),
    min: scores[0] ?? 0,
    max: scores[scores.length - 1] ?? 0,
    avgMisses: Math.round(avg(misses) * 100) / 100,
    hitRate: `${((avg(hitRates)) * 100).toFixed(1)}%`,
    overByLivesRate: `${((overCount / results.length) * 100).toFixed(1)}%`,
    avgTicks: Math.round(avg(ticks) * 10) / 10,
  };
}

function runStrategy(strategy: Strategy, cfg: RhythmConfig): TrialResult[] {
  const results: TrialResult[] = [];
  for (let i = 0; i < TRIALS; i++) {
    results.push(runTrial(strategy, 42_000 + i * 9973, cfg));
  }
  return results;
}

function main(): void {
  const cfg = DEFAULT_RHYTHM_CONFIG;
  console.log(`RhythmDon balance sim – ${TRIALS} trials × 2 strategies`);
  console.log(
    `config: spawnIntervalMs=${cfg.spawnIntervalMs}, hitWindowMs=${cfg.hitWindowMs}, gameDurationMs=${cfg.gameDurationMs}, noteTravelMs=${cfg.noteTravelMs}\n`
  );

  const strategies: Strategy[] = ['perfect', 'human'];
  const rows = strategies.map((s) => summarize(s, runStrategy(s, cfg)));
  console.table(rows);

  const narrowCfg: RhythmConfig = { ...cfg, hitWindowMs: cfg.hitWindowMs / 2 };
  const humanDefault = runStrategy('human', cfg);
  const humanNarrow = runStrategy('human', narrowCfg);
  const defaultHitRate = avg(
    humanDefault.map((r) => (r.spawnCount > 0 ? r.score / r.spawnCount : 0))
  );
  const narrowHitRate = avg(
    humanNarrow.map((r) => (r.spawnCount > 0 ? r.score / r.spawnCount : 0))
  );
  console.log(
    `\nHuman hitRate: default hitWindow=${cfg.hitWindowMs}ms → ${(defaultHitRate * 100).toFixed(1)}%, narrow hitWindow=${narrowCfg.hitWindowMs}ms → ${(narrowHitRate * 100).toFixed(1)}% (Δ ${((narrowHitRate - defaultHitRate) * 100).toFixed(1)}pp)`
  );
}

main();
