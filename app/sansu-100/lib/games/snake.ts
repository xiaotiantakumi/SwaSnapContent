// スネークの純粋ロジック（React非依存・テスト対象）。
// 描画/入力/ループは games/SnakeGame.tsx 側で minigame-core に乗せる。

import { DIR_VECTORS, nextDirection, type Dir, type Vec2 } from '../minigame-core';

export type SnakeState = {
  grid: number; // 正方グリッドの一辺のマス数
  snake: Vec2[]; // 先頭が頭。index0=head
  dir: Dir;
  food: Vec2;
  score: number;
  over: boolean;
};

function sameCell(a: Vec2, b: Vec2): boolean {
  return a.x === b.x && a.y === b.y;
}

/** snake に重ならない空きマスへ food を置く。rand は [0,1)。 */
export function placeFood(
  snake: Vec2[],
  grid: number,
  rand: () => number
): Vec2 {
  const occupied = new Set(snake.map((c) => c.y * grid + c.x));
  const free: number[] = [];
  for (let i = 0; i < grid * grid; i++) {
    if (!occupied.has(i)) free.push(i);
  }
  if (free.length === 0) return { ...snake[0] }; // 盤面が埋まった（実質クリア）
  const idx = free[Math.floor(rand() * free.length)];
  return { x: idx % grid, y: Math.floor(idx / grid) };
}

/** 初期状態。中央に長さ3のヘビ、右向き。 */
export function createSnake(grid: number, rand: () => number): SnakeState {
  const cy = Math.floor(grid / 2);
  const cx = Math.floor(grid / 2);
  const snake: Vec2[] = [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ];
  return {
    grid,
    snake,
    dir: 'right',
    food: placeFood(snake, grid, rand),
    score: 0,
    over: false,
  };
}

/** 1ステップ進める。requested は今フレームの入力方向（180度反転は無視）。 */
export function stepSnake(
  s: SnakeState,
  requested: Dir,
  rand: () => number
): SnakeState {
  if (s.over) return s;
  const dir = nextDirection(s.dir, requested);
  const v = DIR_VECTORS[dir];
  const head: Vec2 = { x: s.snake[0].x + v.x, y: s.snake[0].y + v.y };

  // 壁に当たる
  if (head.x < 0 || head.y < 0 || head.x >= s.grid || head.y >= s.grid) {
    return { ...s, dir, over: true };
  }

  const ate = sameCell(head, s.food);
  // 食べないときは尻尾が動くので、衝突判定から末尾1マスを除外する。
  const body = ate ? s.snake : s.snake.slice(0, s.snake.length - 1);
  if (body.some((c) => sameCell(c, head))) {
    return { ...s, dir, over: true };
  }

  const snake = ate
    ? [head, ...s.snake]
    : [head, ...s.snake.slice(0, s.snake.length - 1)];

  if (ate) {
    return {
      ...s,
      dir,
      snake,
      score: s.score + 1,
      food: placeFood(snake, s.grid, rand),
    };
  }
  return { ...s, dir, snake };
}
