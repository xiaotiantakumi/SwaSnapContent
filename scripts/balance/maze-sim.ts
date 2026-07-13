// めいろ bot シミュレーション（React非依存・ヘッドレス）。
// lib/games/maze.ts の純粋ロジックのみを使い、「レベル進行＋制限時間」の外側ループを自前で再構成する。
// パイロット scripts/balance/pakupaku-sim.ts と同じスタイル。

import {
  createMaze,
  moveMaze,
  mazeTimeLimit,
  mazeSize,
  N,
  E,
  S,
  W,
  type MazeState,
} from '../../app/sansu-100/lib/games/maze';
import type { Dir } from '../../app/sansu-100/lib/minigame-core';

const TRIALS = 2000;

// ── 時間モデルの前提 ───────────────────────────────────────────────
// 迷路はターン制。プレイヤーが 1 手（1マス移動）にかける時間を固定と仮定する。
const MOVE_MS = 400; // 1手あたり 400ms と仮定
// 1レベルあたりの安全上限手数（詰み・無限徘徊の打ち切り）。
const MAX_MOVES_PER_LEVEL = 2000;
// 到達レベルの安全上限（強い戦略が時間内に無限クリアし続けるのを打ち切る）。
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

// セルの開いている辺 → 進める方向の一覧。
const EDGES: { bit: number; dir: Dir; dx: number; dy: number }[] = [
  { bit: N, dir: 'up', dx: 0, dy: -1 },
  { bit: E, dir: 'right', dx: 1, dy: 0 },
  { bit: S, dir: 'down', dx: 0, dy: 1 },
  { bit: W, dir: 'left', dx: -1, dy: 0 },
];

/** 現在セルで開いている辺の方向一覧。 */
function openDirs(s: MazeState): Dir[] {
  const idx = s.py * s.cols + s.px;
  const cell = s.cells[idx];
  const out: Dir[] = [];
  for (const e of EDGES) {
    if ((cell & e.bit) !== 0) out.push(e.dir);
  }
  return out;
}

/** 開いた辺を尊重した BFS で現在セル→ゴールへの最短経路の「次の一手」を返す。 */
function bfsNextDir(s: MazeState): Dir | null {
  const { cols, rows, cells, px, py, gx, gy } = s;
  const start = py * cols + px;
  const goal = gy * cols + gx;
  if (start === goal) return null;

  const visited = new Uint8Array(cols * rows);
  const prev = new Int32Array(cols * rows).fill(-1);
  const queue: number[] = [start];
  visited[start] = 1;

  let found = -1;
  while (queue.length > 0) {
    const cur = queue.shift();
    if (cur === undefined) break;
    if (cur === goal) {
      found = cur;
      break;
    }
    const cx = cur % cols;
    const cy = Math.floor(cur / cols);
    const cell = cells[cur];
    for (const e of EDGES) {
      if ((cell & e.bit) === 0) continue; // 壁
      const nx = cx + e.dx;
      const ny = cy + e.dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const ni = ny * cols + nx;
      if (visited[ni]) continue;
      visited[ni] = 1;
      prev[ni] = cur;
      queue.push(ni);
    }
  }

  if (found < 0) return null;

  // ゴールから遡って start の次のセルを求める。
  let step = found;
  while (prev[step] >= 0 && prev[step] !== start) {
    step = prev[step];
  }
  if (prev[step] < 0) return null;

  const sx = step % cols;
  const sy = Math.floor(step / cols);
  const dx = sx - px;
  const dy = sy - py;
  if (dx === 1) return 'right';
  if (dx === -1) return 'left';
  if (dy === 1) return 'down';
  if (dy === -1) return 'up';
  return null;
}

type Strategy = 'random' | 'solver';

interface TrialResult {
  cleared: number; // 到達（クリア）したレベル数
  totalMoves: number; // 全レベル合計の移動手数
}

/** 1レベルをbotに解かせる。到達手数を返す（詰み/上限は null）。 */
function solveLevel(
  strategy: Strategy,
  state: MazeState,
  botRng: () => number,
): number | null {
  let s = state;
  while (!s.over) {
    if (s.moves >= MAX_MOVES_PER_LEVEL) return null; // 詰み扱い
    let dir: Dir | null;
    if (strategy === 'random') {
      const opts = openDirs(s);
      if (opts.length === 0) return null;
      dir = opts[Math.floor(botRng() * opts.length)];
    } else {
      dir = bfsNextDir(s);
      if (dir === null) return null;
    }
    s = moveMaze(s, dir);
  }
  return s.moves;
}

function runTrial(strategy: Strategy, seed: number): TrialResult {
  const gameRng = makeRng(seed);
  const botRng = makeRng(seed + 1_000_003);
  let cleared = 0;
  let totalMoves = 0;

  for (let level = 1; level <= MAX_LEVEL; level++) {
    const maze = createMaze(gameRng, level);
    const moves = solveLevel(strategy, maze, botRng);
    if (moves === null) break; // 詰み・上限
    if (moves * MOVE_MS > mazeTimeLimit(level) * 1000) break; // 時間切れ
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
  const l1 = mazeSize(1);
  console.log(
    `Maze balance sim – ${TRIALS} trials × 2 strategies (random / solver)`,
  );
  console.log(
    `時間モデル: 1手=${MOVE_MS}ms 固定, 制限時間=mazeTimeLimit(level)秒, ` +
      `レベル上限=${MAX_LEVEL}, 1レベル最大手数=${MAX_MOVES_PER_LEVEL}`,
  );
  console.log(
    `Lv1 迷路サイズ: ${l1.cols}×${l1.rows}（レベルが上がると縦長に）\n`,
  );

  const strategies: Strategy[] = ['random', 'solver'];
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
