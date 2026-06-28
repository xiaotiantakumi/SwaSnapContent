// よけよけランナーの純粋ロジック（React非依存・テスト対象）。
// キャラは固定位置で、世界が左へスクロール。障害物をジャンプでよける。距離=スコア。

export const RUNNER = {
  worldW: 300, // 論理ワールド幅
  groundH: 8, // 地面の高さ（描画用）
  playerX: 44, // プレイヤーの固定X
  playerW: 18,
  playerH: 24,
  gravity: 1.1, // 1tick あたりの落下加速
  jumpV: 12, // ジャンプ初速（上向き）
  baseSpeed: 3, // 初期スクロール速度
  maxSpeed: 7,
  speedPerDist: 1 / 350, // 距離に応じた加速
  obMinH: 14,
  obMaxH: 30,
  obMinW: 14,
  obMaxW: 22,
  spawnMin: 42, // 障害物の最小出現間隔(tick)
  spawnRand: 34, // 追加ランダム間隔
} as const;

export type Obstacle = { x: number; w: number; h: number };

export type RunnerState = {
  py: number; // 地面からの高さ（0=接地, 上が正）
  vy: number; // 縦速度（上が正）
  onGround: boolean;
  obstacles: Obstacle[];
  speed: number;
  distance: number; // スコア（スクロール量）
  spawnTimer: number;
  over: boolean;
};

export function createRunner(rand: () => number): RunnerState {
  return {
    py: 0,
    vy: 0,
    onGround: true,
    obstacles: [],
    speed: RUNNER.baseSpeed,
    distance: 0,
    spawnTimer: RUNNER.spawnMin + Math.floor(rand() * RUNNER.spawnRand),
    over: false,
  };
}

function spawnObstacle(rand: () => number): Obstacle {
  return {
    x: RUNNER.worldW,
    w: RUNNER.obMinW + Math.floor(rand() * (RUNNER.obMaxW - RUNNER.obMinW)),
    h: RUNNER.obMinH + Math.floor(rand() * (RUNNER.obMaxH - RUNNER.obMinH)),
  };
}

function hits(s: RunnerState): boolean {
  const pL = RUNNER.playerX;
  const pR = RUNNER.playerX + RUNNER.playerW;
  for (const o of s.obstacles) {
    const overlapX = pL < o.x + o.w && pR > o.x;
    // プレイヤーの足元(py)が障害物の高さより下なら衝突
    if (overlapX && s.py < o.h) return true;
  }
  return false;
}

/** 1ステップ進める。jump=このtickのジャンプ入力。 */
export function stepRunner(
  s: RunnerState,
  jump: boolean,
  rand: () => number
): RunnerState {
  if (s.over) return s;

  // ジャンプ／重力
  let vy = s.vy;
  let onGround = s.onGround;
  if (jump && onGround) {
    vy = RUNNER.jumpV;
    onGround = false;
  }
  vy -= RUNNER.gravity;
  let py = s.py + vy;
  if (py <= 0) {
    py = 0;
    vy = 0;
    onGround = true;
  }

  const speed = Math.min(
    RUNNER.maxSpeed,
    RUNNER.baseSpeed + s.distance * RUNNER.speedPerDist
  );

  // 障害物スクロール＋画面外除去
  const obstacles = s.obstacles
    .map((o) => ({ ...o, x: o.x - speed }))
    .filter((o) => o.x + o.w > -2);

  // 出現
  let spawnTimer = s.spawnTimer - 1;
  if (spawnTimer <= 0) {
    obstacles.push(spawnObstacle(rand));
    spawnTimer = RUNNER.spawnMin + Math.floor(rand() * RUNNER.spawnRand);
  }

  const next: RunnerState = {
    py,
    vy,
    onGround,
    obstacles,
    speed,
    distance: s.distance + Math.round(speed),
    spawnTimer,
    over: false,
  };
  if (hits(next)) next.over = true;
  return next;
}
