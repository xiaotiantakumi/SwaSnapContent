// ブロック崩しの純粋ロジック（React非依存・テスト対象）。
// パドルでボールを跳ね返してブロックを消す。論理座標 w×h、描画側がスケールする。

export const BREAKOUT = {
  w: 200,
  h: 260,
  ballR: 4,
  speed: 3.6,
  paddleW: 48,
  paddleH: 8,
  paddleY: 246, // パドル上端
  cols: 7,
  rows: 4,
  brickTop: 26,
  brickH: 12,
} as const;

export const BRICK_W = BREAKOUT.w / BREAKOUT.cols;

export type BreakoutState = {
  bx: number;
  by: number;
  vx: number;
  vy: number;
  paddleX: number; // パドル左端
  bricks: boolean[]; // rows*cols, true=のこってる
  score: number;
  over: boolean;
  won: boolean;
};

export function createBreakout(): BreakoutState {
  return {
    bx: BREAKOUT.w / 2,
    by: BREAKOUT.paddleY - 12,
    vx: BREAKOUT.speed * 0.6,
    vy: -BREAKOUT.speed,
    paddleX: (BREAKOUT.w - BREAKOUT.paddleW) / 2,
    bricks: Array.from({ length: BREAKOUT.rows * BREAKOUT.cols }, () => true),
    score: 0,
    over: false,
    won: false,
  };
}

function clampPaddle(x: number): number {
  return Math.max(0, Math.min(BREAKOUT.w - BREAKOUT.paddleW, x));
}

/** 1ステップ。paddleX=このフレームの希望パドル左端。 */
export function stepBreakout(
  s: BreakoutState,
  paddleX: number
): BreakoutState {
  if (s.over) return s;
  const r = BREAKOUT.ballR;
  const paddle = clampPaddle(paddleX);

  let bx = s.bx + s.vx;
  let by = s.by + s.vy;
  let vx = s.vx;
  let vy = s.vy;

  // 壁
  if (bx < r) {
    bx = r;
    vx = Math.abs(vx);
  } else if (bx > BREAKOUT.w - r) {
    bx = BREAKOUT.w - r;
    vx = -Math.abs(vx);
  }
  if (by < r) {
    by = r;
    vy = Math.abs(vy);
  }

  // パドル
  if (
    vy > 0 &&
    by + r >= BREAKOUT.paddleY &&
    by - r <= BREAKOUT.paddleY + BREAKOUT.paddleH &&
    bx >= paddle &&
    bx <= paddle + BREAKOUT.paddleW
  ) {
    vy = -Math.abs(vy);
    // 当たった位置で左右に角度をつける（-1..1）
    const hit = (bx - (paddle + BREAKOUT.paddleW / 2)) / (BREAKOUT.paddleW / 2);
    vx = BREAKOUT.speed * hit;
  }

  // ブロック（ボール半径を考慮した帯判定＋行列をクランプ）
  let bricks = s.bricks;
  let score = s.score;
  const brickBottom = BREAKOUT.brickTop + BREAKOUT.rows * BREAKOUT.brickH;
  if (by + r >= BREAKOUT.brickTop && by - r <= brickBottom) {
    const clampedY = Math.max(
      BREAKOUT.brickTop,
      Math.min(brickBottom - 0.001, by)
    );
    const col = Math.max(0, Math.min(BREAKOUT.cols - 1, Math.floor(bx / BRICK_W)));
    const row = Math.floor((clampedY - BREAKOUT.brickTop) / BREAKOUT.brickH);
    if (row >= 0 && row < BREAKOUT.rows) {
      const idx = row * BREAKOUT.cols + col;
      if (s.bricks[idx]) {
        bricks = s.bricks.slice();
        bricks[idx] = false;
        score += 1;
        vy = -vy;
      }
    }
  }

  const won = bricks.every((b) => !b);
  const fell = by - r > BREAKOUT.h;

  return {
    bx,
    by,
    vx,
    vy,
    paddleX: paddle,
    bricks,
    score,
    over: won || fell,
    won,
  };
}
