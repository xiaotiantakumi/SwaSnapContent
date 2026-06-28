// ぱたぱた（フラッピー系）の純粋ロジック（React非依存・テスト対象）。
// タップで上昇、重力で落下。すき間のあるパイプをくぐる。ぶつかると終わり。

export const FLAPPY = {
  w: 200,
  h: 260,
  birdX: 54,
  birdR: 9,
  gravity: 0.4, // やさしめ
  flapV: 6, // 上向きの初速（上が正）
  pipeW: 30,
  gapH: 108, // すき間を広めに（子ども向け）
  speed: 1.9,
  spawnGap: 110, // パイプ間隔(tick)。広めで余裕を持たせる
  gapMargin: 22, // すき間が画面端に寄りすぎない余白
} as const;

export type Pipe = { x: number; gapY: number; scored: boolean }; // gapY=すき間の上端

export type FlappyState = {
  by: number; // 鳥の高さ（上が0、下がh）
  vy: number; // 縦速度（上が正）
  pipes: Pipe[];
  score: number;
  spawnTimer: number;
  over: boolean;
};

export function createFlappy(rand: () => number): FlappyState {
  return {
    by: FLAPPY.h / 2,
    vy: 0,
    pipes: [],
    score: 0,
    spawnTimer: 12,
    over: false,
  };
}

function randGapY(rand: () => number): number {
  const min = FLAPPY.gapMargin;
  const max = FLAPPY.h - FLAPPY.gapH - FLAPPY.gapMargin;
  return min + Math.floor(rand() * (max - min));
}

function hitsPipe(by: number, p: Pipe): boolean {
  const bl = FLAPPY.birdX - FLAPPY.birdR;
  const br = FLAPPY.birdX + FLAPPY.birdR;
  const overlapX = bl < p.x + FLAPPY.pipeW && br > p.x;
  if (!overlapX) return false;
  // すき間の外（上 or 下）に鳥がいれば当たり
  const top = by - FLAPPY.birdR;
  const bottom = by + FLAPPY.birdR;
  return top < p.gapY || bottom > p.gapY + FLAPPY.gapH;
}

/** 1ステップ。flap=このtickのタップ。 */
export function stepFlappy(
  s: FlappyState,
  flap: boolean,
  rand: () => number
): FlappyState {
  if (s.over) return s;
  let vy = s.vy - FLAPPY.gravity;
  if (flap) vy = FLAPPY.flapV;
  const by = s.by - vy; // vy 上向き正なので y は減る

  // 天井・床
  if (by < FLAPPY.birdR || by > FLAPPY.h - FLAPPY.birdR) {
    return { ...s, by: Math.max(0, Math.min(FLAPPY.h, by)), vy, over: true };
  }

  let score = s.score;
  const pipes = s.pipes
    .map((p) => {
      const x = p.x - FLAPPY.speed;
      let scored = p.scored;
      if (!scored && x + FLAPPY.pipeW < FLAPPY.birdX) {
        scored = true;
        score += 1;
      }
      return { ...p, x, scored };
    })
    .filter((p) => p.x + FLAPPY.pipeW > -2);

  let spawnTimer = s.spawnTimer - 1;
  if (spawnTimer <= 0) {
    pipes.push({ x: FLAPPY.w, gapY: randGapY(rand), scored: false });
    spawnTimer = FLAPPY.spawnGap;
  }

  const over = pipes.some((p) => hitsPipe(by, p));
  return { by, vy, pipes, score, spawnTimer, over };
}
