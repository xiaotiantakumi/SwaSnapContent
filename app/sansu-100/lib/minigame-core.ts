// ミニゲーム共通土台。
// パフォーマンスのため固定タイムステップ + requestAnimationFrame を使う
// （setInterval はタブ非アクティブで暴れるため不使用）。
// 純粋ロジック（advance / 方向まわり / 難易度）はテスト対象。Canvas/rAF は薄いラッパ。

export type Vec2 = { x: number; y: number };
export type Dir = 'up' | 'down' | 'left' | 'right';

export const DIR_VECTORS: Record<Dir, Vec2> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Dir, Dir> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export function isOpposite(a: Dir, b: Dir): boolean {
  return OPPOSITE[a] === b;
}

/**
 * 入力された進行方向を反映する。真逆（180度反転）は無視して現在方向を維持する
 * （スネーク等で自分の体に即死するのを防ぐ）。
 */
export function nextDirection(current: Dir, requested: Dir): Dir {
  return isOpposite(current, requested) ? current : requested;
}

export type AdvanceResult = { steps: number; remainder: number };

/**
 * 固定タイムステップのアキュムレータ計算（純粋関数）。
 * 経過時間を stepMs 刻みの論理ステップ数に変換する。
 * 長いフレーム落ち（タブ復帰など）で steps が爆発しないよう maxSteps で頭打ちにする。
 */
export function advance(
  accumulatorMs: number,
  deltaMs: number,
  stepMs: number,
  maxSteps = 5
): AdvanceResult {
  if (stepMs <= 0) return { steps: 0, remainder: 0 };
  // 異常な delta（負値・NaN）は 0 に丸める
  const safeDelta = Number.isFinite(deltaMs) && deltaMs > 0 ? deltaMs : 0;
  let acc = accumulatorMs + safeDelta;
  let steps = 0;
  while (acc >= stepMs && steps < maxSteps) {
    acc -= stepMs;
    steps += 1;
  }
  // 上限に達したら余剰は捨てる（次フレームへ持ち越して雪だるま化させない）
  if (steps >= maxSteps) acc = acc % stepMs;
  return { steps, remainder: acc };
}

/**
 * スコアに応じて1ステップの間隔(ms)を縮める = だんだん速くなる難易度カーブ。
 * baseMs から minMs まで、scorePerSpeedup 点ごとに stepDownMs ずつ短縮。
 */
export function tickIntervalForScore(
  score: number,
  opts: {
    baseMs: number;
    minMs: number;
    scorePerSpeedup: number;
    stepDownMs: number;
  }
): number {
  const { baseMs, minMs, scorePerSpeedup, stepDownMs } = opts;
  if (scorePerSpeedup <= 0) return baseMs;
  const speedups = Math.floor(Math.max(0, score) / scorePerSpeedup);
  return Math.max(minMs, baseMs - speedups * stepDownMs);
}

// ---- 入力状態（キーボード＋オンスクリーン共通） ----

export type InputState = { dir: Dir; action: boolean };

export function createInputState(initialDir: Dir = 'right'): InputState {
  return { dir: initialDir, action: false };
}

const KEY_TO_DIR: Record<string, Dir | undefined> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
};

const ACTION_KEYS = new Set([' ', 'Spacebar', 'ArrowUp', 'w', 'W']);

export function dirFromKey(key: string): Dir | undefined {
  return KEY_TO_DIR[key];
}

export function isActionKey(key: string): boolean {
  return ACTION_KEYS.has(key);
}

// ---- Canvas ヘルパ（薄いラッパ。ユニットテスト対象外） ----

/**
 * devicePixelRatio を考慮して描画サイズを設定する。初期化時に1回だけ呼ぶ。
 * 論理座標(cssSize)で描けるよう ctx をスケールして返す。
 */
export function setupCanvas(
  canvas: HTMLCanvasElement,
  cssSize: number,
  dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  canvas.width = Math.round(cssSize * dpr);
  canvas.height = Math.round(cssSize * dpr);
  canvas.style.width = `${cssSize}px`;
  canvas.style.height = `${cssSize}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  size: number,
  color = '#0f172a'
): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
}

/** グリッド1マスを塗る（角丸つき）。cell は1マスのピクセル幅。 */
export function drawCell(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  cell: number,
  color: string,
  pad = 1
): void {
  ctx.fillStyle = color;
  ctx.fillRect(gx * cell + pad, gy * cell + pad, cell - pad * 2, cell - pad * 2);
}

// ---- ゲームループ駆動（requestAnimationFrame ラッパ） ----

export type GameLoopHandle = { stop: () => void };

/**
 * 固定タイムステップのゲームループを開始する。
 * onTick は stepMs ごとに呼ばれ（フレーム落ち時は複数回）、onRender は毎フレーム呼ばれる。
 * 返り値の stop() で必ず停止すること（アンマウント時のリーク防止）。
 */
export function startGameLoop(opts: {
  stepMs: () => number;
  onTick: () => void;
  onRender: () => void;
  maxSteps?: number;
}): GameLoopHandle {
  const { onTick, onRender, maxSteps = 5 } = opts;
  let raf = 0;
  let last = 0;
  let acc = 0;
  let stopped = false;

  const frame = (now: number) => {
    if (stopped) return;
    if (last === 0) last = now;
    const delta = now - last;
    last = now;
    const stepMs = opts.stepMs();
    const { steps, remainder } = advance(acc, delta, stepMs, maxSteps);
    acc = remainder;
    for (let i = 0; i < steps; i++) onTick();
    onRender();
    raf = requestAnimationFrame(frame);
  };

  raf = requestAnimationFrame(frame);
  return {
    stop: () => {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
    },
  };
}
