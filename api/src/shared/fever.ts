// フィーバー(おすすめ)レベル判定（サーバー版・確定値）。
// 重要: app/sansu-100/lib/fever.ts と「同一ロジック」で複製している（client/server一致）。

export const FEVER_INTERVAL_MS = 15 * 60 * 1000; // 15分

const FEVER_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export const FEVER_MULTIPLIERS = [2, 3];

// 同じ15分枠でルーレットを回せる回数
export const FEVER_MAX_PER_WINDOW = 3;

/** その枠ですでに使った回数（user の枠カウントから計算）。 */
export function feverUsesInWindow(
  interval: number,
  windowInterval: number | undefined,
  windowUses: number | undefined
): number {
  return windowInterval === interval ? (windowUses ?? 0) : 0;
}

export function feverIntervalIndex(now: number): number {
  return Math.floor(now / FEVER_INTERVAL_MS);
}

export function feverLevelForIndex(idx: number): number {
  let x = (idx + 1) >>> 0;
  x ^= x << 13;
  x >>>= 0;
  x ^= x >>> 17;
  x ^= x << 5;
  x >>>= 0;
  return FEVER_LEVELS[x % FEVER_LEVELS.length];
}

export function feverLevel(now: number): number {
  return feverLevelForIndex(feverIntervalIndex(now));
}

/** 送信された開始時刻が信頼できる範囲か（時計詐称対策）。 */
export function isStartedAtRecent(startedAt: number, now: number): boolean {
  return startedAt <= now + 60_000 && now - startedAt < 25 * 60 * 1000;
}
