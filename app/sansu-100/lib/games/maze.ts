// めいろの純粋ロジック（React非依存・テスト対象）。
// recursive-backtracker で「穴のない完全迷路」を生成。スタート左上→ゴール右下。

import type { Dir } from '../minigame-core';

export const MAZE = { cols: 7, rows: 10, maxRows: 18 } as const;

// レベルに応じて迷路を大きく（縦長に）して難しくする。横幅は固定。
export function mazeSize(level: number): { cols: number; rows: number } {
  return {
    cols: MAZE.cols,
    rows: Math.min(MAZE.maxRows, MAZE.rows + (level - 1) * 2),
  };
}

// 開いている辺のビットマスク
export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;

export type MazeState = {
  cols: number;
  rows: number;
  cells: number[]; // 各セルの「開いている辺」ビットマスク
  px: number;
  py: number;
  gx: number; // ゴール
  gy: number;
  moves: number;
  over: boolean;
};

const STEPS = [
  { dx: 0, dy: -1, bit: N, opp: S },
  { dx: 1, dy: 0, bit: E, opp: W },
  { dx: 0, dy: 1, bit: S, opp: N },
  { dx: -1, dy: 0, bit: W, opp: E },
];

export function createMaze(rand: () => number, level = 1): MazeState {
  const { cols, rows } = mazeSize(level);
  const cells = new Array<number>(cols * rows).fill(0);
  const visited = new Array<boolean>(cols * rows).fill(false);
  const stack: number[] = [0];
  visited[0] = true;

  while (stack.length > 0) {
    const cur = stack[stack.length - 1];
    const cx = cur % cols;
    const cy = Math.floor(cur / cols);
    const opts: { ni: number; bit: number; opp: number }[] = [];
    for (const st of STEPS) {
      const nx = cx + st.dx;
      const ny = cy + st.dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const ni = ny * cols + nx;
      if (!visited[ni]) opts.push({ ni, bit: st.bit, opp: st.opp });
    }
    if (opts.length === 0) {
      stack.pop();
      continue;
    }
    const pick = opts[Math.floor(rand() * opts.length)];
    cells[cur] |= pick.bit;
    cells[pick.ni] |= pick.opp;
    visited[pick.ni] = true;
    stack.push(pick.ni);
  }

  return {
    cols,
    rows,
    cells,
    px: 0,
    py: 0,
    gx: cols - 1,
    gy: rows - 1,
    moves: 0,
    over: false,
  };
}

const DIR_BIT: Record<Dir, { bit: number; dx: number; dy: number }> = {
  up: { bit: N, dx: 0, dy: -1 },
  down: { bit: S, dx: 0, dy: 1 },
  left: { bit: W, dx: -1, dy: 0 },
  right: { bit: E, dx: 1, dy: 0 },
};

/** 壁が無ければ1マス動く。ゴールに着いたら over。 */
export function moveMaze(s: MazeState, dir: Dir): MazeState {
  if (s.over) return s;
  const d = DIR_BIT[dir];
  const idx = s.py * s.cols + s.px;
  if ((s.cells[idx] & d.bit) === 0) return s; // 壁
  const px = s.px + d.dx;
  const py = s.py + d.dy;
  const over = px === s.gx && py === s.gy;
  return { ...s, px, py, moves: s.moves + 1, over };
}
