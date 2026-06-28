// よけよけランナーの純粋ロジック（React非依存・テスト対象）。
// キャラは固定X、世界が左へスクロール。地上の障害物はジャンプでよけ、ふゆう台(platform)には
// 乗って走り、はしから降りられる。距離=スコア。一定距離ごとにレベルアップして速くなる。

export const RUNNER = {
  worldW: 320, // 論理ワールド幅
  worldH: 150, // 論理ワールド高さ（縦長に）
  groundH: 10, // 地面の高さ（描画用）
  playerX: 48, // プレイヤーの固定X
  playerW: 20,
  playerH: 26,
  gravity: 0.9, // 1tick あたりの落下加速
  jumpV: 13, // ジャンプ初速（上向き）
  baseSpeed: 3, // レベル1のスクロール速度
  speedPerLevel: 0.8, // レベルごとの加速
  maxSpeed: 9,
  distPerLevel: 240, // この距離ごとにレベルアップ
  obMinH: 16,
  obMaxH: 34,
  obMinW: 16,
  obMaxW: 24,
  platMinTop: 42, // ふゆう台の高さ（下端）
  platMaxTop: 62,
  platMinW: 52,
  platMaxW: 80,
  spawnMin: 40, // 出現の最小間隔(tick)
  spawnRand: 30, // 追加ランダム間隔
} as const;

export type Obstacle = { x: number; w: number; h: number };
export type Platform = { x: number; w: number; top: number };

export type RunnerState = {
  py: number; // 足元の高さ（0=地面）
  vy: number; // 縦速度（上が正）
  onGround: boolean;
  obstacles: Obstacle[];
  platforms: Platform[];
  speed: number;
  distance: number; // スコア
  level: number;
  leveledUp: boolean; // このtickでレベルが上がったか（演出用）
  spawnTimer: number;
  over: boolean;
};

export function createRunner(rand: () => number): RunnerState {
  return {
    py: 0,
    vy: 0,
    onGround: true,
    obstacles: [],
    platforms: [],
    speed: RUNNER.baseSpeed,
    distance: 0,
    level: 1,
    leveledUp: false,
    spawnTimer: RUNNER.spawnMin + Math.floor(rand() * RUNNER.spawnRand),
    over: false,
  };
}

const ri = (rand: () => number, lo: number, hi: number): number =>
  lo + Math.floor(rand() * (hi - lo + 1));

// 出現パターン: 障害物だけ / ふゆう台（その手前に背の高い壁を置いて「台に乗って降りる」誘導）
function spawn(
  rand: () => number
): { obstacles: Obstacle[]; platforms: Platform[] } {
  if (rand() < 0.45) {
    const top = ri(rand, RUNNER.platMinTop, RUNNER.platMaxTop);
    const w = ri(rand, RUNNER.platMinW, RUNNER.platMaxW);
    const platforms: Platform[] = [{ x: RUNNER.worldW, w, top }];
    const obstacles: Obstacle[] = [];
    // 半分は台の真下あたりに「飛び越えにくい高い壁」を置く → 台に乗って回避する遊び
    if (rand() < 0.6) {
      obstacles.push({ x: RUNNER.worldW + 6, w: 16, h: top + 6 });
    }
    return { obstacles, platforms };
  }
  return {
    obstacles: [
      {
        x: RUNNER.worldW,
        w: ri(rand, RUNNER.obMinW, RUNNER.obMaxW),
        h: ri(rand, RUNNER.obMinH, RUNNER.obMaxH),
      },
    ],
    platforms: [],
  };
}

// プレイヤーが乗れる「足元の支え」の高さ（地面=0 か、重なっている台の上）。
function supportTop(s: RunnerState): number {
  const pl = RUNNER.playerX;
  const pr = RUNNER.playerX + RUNNER.playerW;
  let top = 0; // 地面
  for (const p of s.platforms) {
    const overX = pr > p.x && pl < p.x + p.w;
    if (overX && p.top <= s.py + 0.5 && p.top > top) top = p.top;
  }
  return top;
}

// 地上の障害物に体が当たっているか（足元 py が障害物の高さより下＝避けられていない）。
function hits(s: RunnerState): boolean {
  const pl = RUNNER.playerX;
  const pr = RUNNER.playerX + RUNNER.playerW;
  for (const o of s.obstacles) {
    if (pl < o.x + o.w && pr > o.x && s.py < o.h - 1) return true;
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

  let vy = s.vy;
  let onGround = s.onGround;
  if (jump && onGround) {
    vy = RUNNER.jumpV;
    onGround = false;
  }
  vy -= RUNNER.gravity;
  const newPy = s.py + vy;

  // 足元の支え（古い py を基準に、重なっている台か地面）
  const support = supportTop(s);
  let py = newPy;
  if (newPy <= support) {
    py = support;
    vy = 0;
    onGround = true;
  } else {
    onGround = false;
  }

  // レベル＆速度
  const level = Math.floor(s.distance / RUNNER.distPerLevel) + 1;
  const leveledUp = level > s.level;
  const speed = Math.min(
    RUNNER.maxSpeed,
    RUNNER.baseSpeed + (level - 1) * RUNNER.speedPerLevel
  );

  // スクロール＋画面外除去
  const obstacles = s.obstacles
    .map((o) => ({ ...o, x: o.x - speed }))
    .filter((o) => o.x + o.w > -2);
  const platforms = s.platforms
    .map((p) => ({ ...p, x: p.x - speed }))
    .filter((p) => p.x + p.w > -2);

  // 出現
  let spawnTimer = s.spawnTimer - 1;
  if (spawnTimer <= 0) {
    const f = spawn(rand);
    obstacles.push(...f.obstacles);
    platforms.push(...f.platforms);
    spawnTimer = RUNNER.spawnMin + Math.floor(rand() * RUNNER.spawnRand);
  }

  const next: RunnerState = {
    py,
    vy,
    onGround,
    obstacles,
    platforms,
    speed,
    distance: s.distance + Math.round(speed),
    level,
    leveledUp,
    spawnTimer,
    over: false,
  };
  if (hits(next)) next.over = true;
  return next;
}
