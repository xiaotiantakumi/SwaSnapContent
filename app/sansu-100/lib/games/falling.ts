// おちものよけの純粋ロジック（React非依存・テスト対象）。
// プレイヤーを左右に動かして、上から降ってくる物をよける。生存時間=スコア。

export const FALLING = {
  w: 200,
  h: 250,
  playerY: 226,
  playerW: 30,
  playerH: 22,
  itemR: 9,
  baseSpeed: 2.4,
  maxSpeed: 6,
  speedPerTick: 0.004,
  spawnMin: 14,
  spawnRand: 16,
} as const;

export type FallItem = { x: number; y: number };

export type FallingState = {
  playerX: number; // 左端
  items: FallItem[];
  score: number; // 生存tick
  speed: number;
  spawnTimer: number;
  over: boolean;
};

export function createFalling(rand: () => number): FallingState {
  return {
    playerX: (FALLING.w - FALLING.playerW) / 2,
    items: [],
    score: 0,
    speed: FALLING.baseSpeed,
    spawnTimer: FALLING.spawnMin + Math.floor(rand() * FALLING.spawnRand),
    over: false,
  };
}

function clampPlayer(x: number): number {
  return Math.max(0, Math.min(FALLING.w - FALLING.playerW, x));
}

function collides(playerX: number, it: FallItem): boolean {
  // 円(item) と 矩形(player) の最近点判定
  const pl = playerX;
  const pr = playerX + FALLING.playerW;
  const pt = FALLING.playerY;
  const pb = FALLING.playerY + FALLING.playerH;
  const nx = Math.max(pl, Math.min(it.x, pr));
  const ny = Math.max(pt, Math.min(it.y, pb));
  const dx = it.x - nx;
  const dy = it.y - ny;
  return dx * dx + dy * dy <= FALLING.itemR * FALLING.itemR;
}

/** 1ステップ。playerX=希望プレイヤー左端。 */
export function stepFalling(
  s: FallingState,
  playerX: number,
  rand: () => number
): FallingState {
  if (s.over) return s;
  const player = clampPlayer(playerX);
  const speed = Math.min(
    FALLING.maxSpeed,
    FALLING.baseSpeed + s.score * FALLING.speedPerTick
  );

  const items = s.items
    .map((it) => ({ x: it.x, y: it.y + speed }))
    .filter((it) => it.y - FALLING.itemR < FALLING.h);

  let spawnTimer = s.spawnTimer - 1;
  if (spawnTimer <= 0) {
    items.push({
      x: FALLING.itemR + Math.floor(rand() * (FALLING.w - 2 * FALLING.itemR)),
      y: -FALLING.itemR,
    });
    spawnTimer = FALLING.spawnMin + Math.floor(rand() * FALLING.spawnRand);
  }

  const hit = items.some((it) => collides(player, it));

  return {
    playerX: player,
    items,
    score: s.score + 1,
    speed,
    spawnTimer,
    over: hit,
  };
}
