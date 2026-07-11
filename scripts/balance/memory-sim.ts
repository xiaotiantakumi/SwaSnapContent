// 神経衰弱（メモリー）bot シミュレーション（React非依存・ヘッドレス）。
// lib/games/memory.ts の純粋ロジックのみを使い、「レベル進行＋制限時間」の外側ループを自前で再構成する。
// パイロット scripts/balance/pakupaku-sim.ts と同じスタイル。

import {
  createMemory,
  pickCard,
  resolveMemory,
  memoryPairs,
  memoryTimeLimit,
  type MemoryState,
} from '../../app/sansu-100/lib/games/memory';

const TRIALS = 2000;

// ── 時間モデルの前提 ───────────────────────────────────────────────
// 1手 = 2枚めくり(+不一致なら裏返し) を固定時間と仮定する。
const PAIR_MS = 1500; // 1手（2枚めくり）あたり 1500ms と仮定
// 1ボードあたりの安全上限手数（無限徘徊の打ち切り）。
const MAX_MOVES_PER_BOARD = 10000;
// 到達レベルの安全上限（完璧記憶が時間内に無限クリアし続けるのを打ち切る）。
const MAX_LEVEL = 50;

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

/** まだ場に伏せている（matched でない）カードの index 一覧。 */
function availableIdx(s: MemoryState): number[] {
  const out: number[] = [];
  for (let i = 0; i < s.cards.length; i++) {
    if (!s.cards[i].matched) out.push(i);
  }
  return out;
}

type Strategy = 'random' | 'memory';

interface TrialResult {
  cleared: number; // 到達（クリア）したレベル数
  totalMoves: number; // 全レベル合計の手数
}

/** ランダム戦略：記憶なし。伏せカードから2枚ランダムにめくる。 */
function solveRandom(state: MemoryState, botRng: () => number): number | null {
  let s = state;
  while (!s.cleared) {
    if (s.moves >= MAX_MOVES_PER_BOARD) return null;
    const avail = availableIdx(s);
    if (avail.length < 2) break;
    const a = avail[Math.floor(botRng() * avail.length)];
    let b = a;
    while (b === a) b = avail[Math.floor(botRng() * avail.length)];
    s = pickCard(s, a);
    s = pickCard(s, b);
    if (s.busy) s = resolveMemory(s); // 不一致は即座に裏返し
  }
  return s.moves;
}

/** 記憶戦略：一度めくって見た value→index を覚え、既知の一致ペアを優先して揃える。 */
function solveMemory(state: MemoryState, botRng: () => number): number | null {
  let s = state;
  // 「見た」情報のみ記憶する（未めくりカードの value は覗かない）。
  const known = new Map<number, number>(); // index -> value

  const flip = (st: MemoryState, i: number): MemoryState => {
    const next = pickCard(st, i);
    // pickCard で revealed=true になった自分がめくったカードだけ値を読む。
    if (next.cards[i].revealed || next.cards[i].matched) {
      known.set(i, next.cards[i].value);
    }
    return next;
  };

  const pick = (arr: number[]): number => arr[Math.floor(botRng() * arr.length)];

  while (!s.cleared) {
    if (s.moves >= MAX_MOVES_PER_BOARD) return null;
    const avail = availableIdx(s);
    if (avail.length < 2) break;

    const availSet = new Set(avail);
    // 記憶済み（未取得）の value→indices を集計。
    const byValue = new Map<number, number[]>();
    for (const [idx, val] of known) {
      if (!availSet.has(idx)) continue; // 取得済みは除外
      const list = byValue.get(val) ?? [];
      list.push(idx);
      byValue.set(val, list);
    }

    // 1) 既知の一致ペアがあれば揃える。
    let pairFound: [number, number] | null = null;
    for (const list of byValue.values()) {
      if (list.length >= 2) {
        pairFound = [list[0], list[1]];
        break;
      }
    }
    if (pairFound) {
      s = flip(s, pairFound[0]);
      s = flip(s, pairFound[1]);
      if (s.busy) s = resolveMemory(s);
      continue;
    }

    // 2) 未知カードを1枚めくって探索。
    const unknown = avail.filter((i) => !known.has(i));
    let first: number;
    if (unknown.length > 0) {
      first = pick(unknown);
    } else {
      // 全て既知だが一致ペア無し（理論上は起きにくい）。伏せから任意。
      first = pick(avail);
    }
    s = flip(s, first);
    const v = known.get(first);
    if (v === undefined) continue;

    // 2a) めくった値が既知の別カードと一致するなら、そのペアを揃える。
    const availNow = new Set(availableIdx(s));
    let mate = -1;
    for (const [idx, val] of known) {
      if (idx === first || !availNow.has(idx)) continue;
      if (val === v) {
        mate = idx;
        break;
      }
    }
    if (mate >= 0) {
      s = flip(s, mate);
      if (s.busy) s = resolveMemory(s);
      continue;
    }

    // 2b) 一致先が無ければ別の未知カードをめくって探索。
    const unknown2 = availableIdx(s).filter((i) => i !== first && !known.has(i));
    let second: number;
    if (unknown2.length > 0) {
      second = pick(unknown2);
    } else {
      const rest = availableIdx(s).filter((i) => i !== first);
      if (rest.length === 0) break;
      second = pick(rest);
    }
    s = flip(s, second);
    if (s.busy) s = resolveMemory(s);
  }
  return s.moves;
}

function runTrial(strategy: Strategy, seed: number): TrialResult {
  const gameRng = makeRng(seed);
  const botRng = makeRng(seed + 1_000_003);
  let cleared = 0;
  let totalMoves = 0;

  for (let level = 1; level <= MAX_LEVEL; level++) {
    const board = createMemory(gameRng, level);
    const moves =
      strategy === 'random'
        ? solveRandom(board, botRng)
        : solveMemory(board, botRng);
    if (moves === null) break; // 打ち切り
    if (moves * PAIR_MS > memoryTimeLimit(level) * 1000) break; // 時間切れ
    cleared++;
    totalMoves += moves;
  }

  return { cleared, totalMoves };
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
  const cleared = results.map((r) => r.cleared).sort((a, b) => a - b);
  const moves = results.map((r) => r.totalMoves);
  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const level1 = results.filter((r) => r.cleared >= 1).length;

  return {
    strategy,
    trials: results.length,
    avgCleared: Math.round(avg(cleared) * 100) / 100,
    medianCleared: percentile(cleared, 0.5),
    p25: percentile(cleared, 0.25),
    p75: percentile(cleared, 0.75),
    min: cleared[0] ?? 0,
    max: cleared[cleared.length - 1] ?? 0,
    avgTotalMoves: Math.round(avg(moves) * 10) / 10,
    clearedLevel1Rate: `${((level1 / results.length) * 100).toFixed(1)}%`,
  };
}

function main(): void {
  console.log(
    `Memory balance sim – ${TRIALS} trials × 2 strategies (random / memory)`,
  );
  console.log(
    `時間モデル: 1手(2枚めくり)=${PAIR_MS}ms 固定, 制限時間=memoryTimeLimit(level)秒, ` +
      `レベル上限=${MAX_LEVEL}, 1ボード最大手数=${MAX_MOVES_PER_BOARD}`,
  );
  console.log(
    `Lv1 ペア数: ${memoryPairs(1)}（レベルが上がるとペア数が増える, 上限あり）\n`,
  );

  const strategies: Strategy[] = ['random', 'memory'];
  const rows = strategies.map((strategy) => {
    const results: TrialResult[] = [];
    for (let i = 0; i < TRIALS; i++) {
      results.push(runTrial(strategy, 42_000 + i * 9973));
    }
    return summarize(strategy, results);
  });

  console.table(rows);
}

main();
