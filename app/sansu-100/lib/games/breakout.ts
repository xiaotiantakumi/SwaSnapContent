// ブロック崩しの純粋ロジック（React非依存・テスト対象）。
// パドルでボールを跳ね返してブロックを消す。論理座標 w×h、描画側がスケールする。

export const BREAKOUT = {
  w: 200,
  h: 260,
  ballR: 4,
  speed: 3.4,
  speedUp: 1.14, // レベルごとに速くなる倍率
  maxSpeed: 6.5,
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
  level: number; // クリアするたびに+1（だんだん速くなる）
  speed: number; // 今のボール速さ
  over: boolean;
};

function freshBricks(): boolean[] {
  return Array.from({ length: BREAKOUT.rows * BREAKOUT.cols }, () => true);
}

export function createBreakout(): BreakoutState {
  return {
    bx: BREAKOUT.w / 2,
    by: BREAKOUT.paddleY - 14,
    vx: BREAKOUT.speed * 0.6,
    vy: -BREAKOUT.speed * 0.8,
    paddleX: (BREAKOUT.w - BREAKOUT.paddleW) / 2,
    bricks: freshBricks(),
    score: 0,
    level: 1,
    speed: BREAKOUT.speed,
    over: false,
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
    // 当たった位置で左右に角度をつける（-1..1）。
    // 真ん中ヒットでも真上に行って単調にならないよう、最低限の横の動きを残す。
    let hit = (bx - (paddle + BREAKOUT.paddleW / 2)) / (BREAKOUT.paddleW / 2);
    if (Math.abs(hit) < 0.18) hit = hit >= 0 ? 0.18 : -0.18;
    vx = s.speed * hit;
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

  let level = s.level;
  let speed = s.speed;
  // すべて消したら「終わり」ではなく、次のレベル（速くなって再スタート）
  if (bricks.every((b) => !b)) {
    level += 1;
    speed = Math.min(BREAKOUT.maxSpeed, speed * BREAKOUT.speedUp);
    bricks = freshBricks();
    bx = BREAKOUT.w / 2;
    by = BREAKOUT.paddleY - 14;
    vx = speed * 0.6;
    vy = -speed * 0.8;
  }

  const fell = by - r > BREAKOUT.h;

  return {
    bx,
    by,
    vx,
    vy,
    paddleX: paddle,
    bricks,
    score,
    level,
    speed,
    over: fell,
  };
}
