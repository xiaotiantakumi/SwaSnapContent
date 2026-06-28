import { describe, it, expect } from 'vitest';
import { createMaze, moveMaze, MAZE, N, E, S, W } from '../games/maze';
import type { Dir } from '../minigame-core';

const r0 = () => 0;
const rHalf = () => 0.5;

// BFS で開いている辺をたどって全セル到達できるか＆ゴールまでの経路を返す
function bfsPath(s: ReturnType<typeof createMaze>): Dir[] | null {
  const { cols, rows, cells } = s;
  const start = 0;
  const goal = s.gy * cols + s.gx;
  const prev = new Map<number, { from: number; dir: Dir }>();
  const seen = new Set<number>([start]);
  const q = [start];
  const steps: { bit: number; dx: number; dy: number; dir: Dir }[] = [
    { bit: N, dx: 0, dy: -1, dir: 'up' },
    { bit: E, dx: 1, dy: 0, dir: 'right' },
    { bit: S, dx: 0, dy: 1, dir: 'down' },
    { bit: W, dx: -1, dy: 0, dir: 'left' },
  ];
  while (q.length) {
    const cur = q.shift() as number;
    const cx = cur % cols;
    const cy = Math.floor(cur / cols);
    for (const st of steps) {
      if ((cells[cur] & st.bit) === 0) continue;
      const ni = (cy + st.dy) * cols + (cx + st.dx);
      if (seen.has(ni)) continue;
      seen.add(ni);
      prev.set(ni, { from: cur, dir: st.dir });
      q.push(ni);
    }
  }
  // 全セル到達チェック
  if (seen.size !== cols * rows) return null;
  // 経路復元
  const path: Dir[] = [];
  let cur = goal;
  while (cur !== start) {
    const p = prev.get(cur);
    if (!p) return null;
    path.unshift(p.dir);
    cur = p.from;
  }
  return path;
}

describe('maze', () => {
  it('初期状態: セル数・スタート左上・ゴール右下・未over', () => {
    const s = createMaze(r0);
    expect(s.cells).toHaveLength(MAZE.cols * MAZE.rows);
    expect(s.px).toBe(0);
    expect(s.py).toBe(0);
    expect(s.gx).toBe(MAZE.cols - 1);
    expect(s.gy).toBe(MAZE.rows - 1);
    expect(s.over).toBe(false);
  });

  it('完全迷路: 全セルがつながっている（孤立なし）', () => {
    for (const rand of [r0, rHalf]) {
      const s = createMaze(rand);
      expect(bfsPath(s)).not.toBeNull();
    }
  });

  it('壁のある方向には進めない（左上から上/左は壁）', () => {
    const s = createMaze(r0);
    expect(moveMaze(s, 'up')).toBe(s);
    expect(moveMaze(s, 'left')).toBe(s);
  });

  it('開いている方向には1マス進める', () => {
    const s = createMaze(r0);
    // (0,0) で開いている辺を探して進む
    const open: Dir[] = [];
    if (s.cells[0] & E) open.push('right');
    if (s.cells[0] & S) open.push('down');
    expect(open.length).toBeGreaterThan(0);
    const n = moveMaze(s, open[0]);
    expect(n.moves).toBe(1);
    expect(n.px === 1 || n.py === 1).toBe(true);
  });

  it('ゴールに着くと over', () => {
    let s = createMaze(r0);
    const path = bfsPath(s);
    expect(path).not.toBeNull();
    for (const d of path as Dir[]) s = moveMaze(s, d);
    expect(s.over).toBe(true);
    expect(s.px).toBe(s.gx);
    expect(s.py).toBe(s.gy);
  });
});
