// フィーバー(おすすめ)レベル判定（サーバー版・確定値）。
// 5分ごとに低確率(約1/12)で発生＝だいたい1時間に1回。
// 重要: app/sansu-100/lib/fever.ts と「同一ロジック」で複製している（client/server一致）。

export const FEVER_INTERVAL_MS = 5 * 60 * 1000; // 5分の枠
export const FEVER_ODDS = 12; // 約12枠に1回 = だいたい1時間に1回

const FEVER_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export const FEVER_MULTIPLIERS = [2, 3];

export const FEVER_MAX_PER_WINDOW = 3;

function hash32(n: number): number {
  let x = (n + 1) >>> 0;
  x ^= x << 13;
  x >>>= 0;
  x ^= x >>> 17;
  x ^= x << 5;
  x >>>= 0;
  return x >>> 0;
}

export function feverIntervalIndex(now: number): number {
  return Math.floor(now / FEVER_INTERVAL_MS);
}

export function isFeverWindow(idx: number): boolean {
  return hash32(idx) % FEVER_ODDS === 0;
}

// フィーバー枠ならレベル(1..11)、そうでなければ null
export function feverLevelForIndex(idx: number): number | null {
  if (!isFeverWindow(idx)) return null;
  return FEVER_LEVELS[(hash32(idx) >>> 8) % FEVER_LEVELS.length];
}

export function feverLevel(now: number): number | null {
  return feverLevelForIndex(feverIntervalIndex(now));
}

/** 送信された開始時刻が信頼できる範囲か（時計詐称対策）。5分枠なので余裕を10分に。 */
export function isStartedAtRecent(startedAt: number, now: number): boolean {
  return startedAt <= now + 60_000 && now - startedAt < 10 * 60 * 1000;
}

/** その枠ですでに使った回数（user の枠カウントから計算）。 */
export function feverUsesInWindow(
  interval: number,
  windowInterval: number | undefined,
  windowUses: number | undefined
): number {
  return windowInterval === interval ? (windowUses ?? 0) : 0;
}
