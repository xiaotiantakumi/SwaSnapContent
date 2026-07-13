import { createMaze, mazeTimeLimit, N, E, S, W, type MazeState } from '../../lib/games/maze';

export const ACCEL = 0.012; // セル単位/tick^2
export const FRICTION = 0.92;
export const MAX_SPEED = 0.35; // セル単位/tick（1tickで1セル以上進まないよう安全マージンを持たせる）
export const BALL_R = 0.28; // セル単位

export interface GS {
  maze: MazeState;
  bx: number; // ボール位置（セル単位、左上原点）
  by: number;
  vx: number;
  vy: number;
  level: number;
  cleared: number;
  elapsedMs: number;
  timeLimitMs: number;
  over: boolean;
}

export function cellAt(m: MazeState, cx: number, cy: number): number {
  if (cx < 0 || cy < 0 || cx >= m.cols || cy >= m.rows) return 0;
  return m.cells[cy * m.cols + cx];
}

export function createGS(rand: () => number, level: number): GS {
  const maze = createMaze(rand, level);
  return {
    maze,
    bx: maze.px + 0.5,
    by: maze.py + 0.5,
    vx: 0,
    vy: 0,
    level,
    cleared: level - 1,
    elapsedMs: 0,
    timeLimitMs: mazeTimeLimit(level) * 1000,
    over: false,
  };
}

export function tick(
  gs: GS,
  tiltX: number,
  tiltY: number,
  rand: () => number,
  onEvent: (ev: 'goal' | 'over') => void
): void {
  if (gs.over) return;
  gs.elapsedMs += 16;
  if (gs.elapsedMs >= gs.timeLimitMs) {
    gs.over = true;
    onEvent('over');
    return;
  }

  gs.vx = (gs.vx + tiltX * ACCEL) * FRICTION;
  gs.vy = (gs.vy + tiltY * ACCEL) * FRICTION;
  gs.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, gs.vx));
  gs.vy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, gs.vy));

  const m = gs.maze;
  const cx = Math.floor(gs.bx);
  const cy = Math.floor(gs.by);
  const cell = cellAt(m, cx, cy);

  // X軸移動（壁で停止）
  if (gs.vx > 0) {
    const boundary = cx + 1;
    const nx = gs.bx + gs.vx;
    if ((cell & E) === 0 && nx + BALL_R >= boundary) {
      gs.bx = boundary - BALL_R;
      gs.vx = 0;
    } else {
      gs.bx = nx;
    }
  } else if (gs.vx < 0) {
    const boundary = cx;
    const nx = gs.bx + gs.vx;
    if ((cell & W) === 0 && nx - BALL_R <= boundary) {
      gs.bx = boundary + BALL_R;
      gs.vx = 0;
    } else {
      gs.bx = nx;
    }
  }

  // Y軸移動（壁で停止）。X軸移動後のセルを再評価する。
  const cx2 = Math.floor(gs.bx);
  const cy2 = Math.floor(gs.by);
  const cell2 = cellAt(m, cx2, cy2);
  if (gs.vy > 0) {
    const boundary = cy2 + 1;
    const ny = gs.by + gs.vy;
    if ((cell2 & S) === 0 && ny + BALL_R >= boundary) {
      gs.by = boundary - BALL_R;
      gs.vy = 0;
    } else {
      gs.by = ny;
    }
  } else if (gs.vy < 0) {
    const boundary = cy2;
    const ny = gs.by + gs.vy;
    if ((cell2 & N) === 0 && ny - BALL_R <= boundary) {
      gs.by = boundary + BALL_R;
      gs.vy = 0;
    } else {
      gs.by = ny;
    }
  }

  // ゴール判定（ゴールセルの中心に十分近づいたらクリア）
  const gcx = m.gx + 0.5;
  const gcy = m.gy + 0.5;
  const dist = Math.hypot(gs.bx - gcx, gs.by - gcy);
  if (dist < 0.32) {
    gs.cleared = gs.level;
    onEvent('goal');
    const nextLevel = gs.level + 1;
    const nextMaze = createMaze(rand, nextLevel);
    gs.maze = nextMaze;
    gs.bx = nextMaze.px + 0.5;
    gs.by = nextMaze.py + 0.5;
    gs.vx = 0;
    gs.vy = 0;
    gs.level = nextLevel;
    gs.elapsedMs = 0;
    gs.timeLimitMs = mazeTimeLimit(nextLevel) * 1000;
  }
}
