// 「フィーバー(おすすめ)レベル」を時刻から決める純粋ロジック。
// 5分ごとに低確率(約1/12)でフィーバーが発生＝だいたい1時間に1回。常時ではない。
// 重要: api/src/shared/fever.ts と「同一ロジック」で複製している（client/server一致）。

import type { LevelId } from './types';

export const FEVER_INTERVAL_MS = 5 * 60 * 1000; // 5分の枠
// 約何枠に1回フィーバーが出るか（12枠=1時間 → だいたい1時間に1回）
export const FEVER_ODDS = 12;

// フィーバー対象になりうる具体レベル（mix は除外）
const FEVER_LEVELS: readonly LevelId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

// ルーレットの倍率候補
export const FEVER_MULTIPLIERS = [2, 3] as const;

// 同じフィーバー枠でルーレットを回せる回数
export const FEVER_MAX_PER_WINDOW = 3;

// xorshift32（client/server で同一の決定的ハッシュ）
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

// その枠がフィーバーか（約 1/FEVER_ODDS）
export function isFeverWindow(idx: number): boolean {
  return hash32(idx) % FEVER_ODDS === 0;
}

// フィーバー枠ならレベル、そうでなければ null
export function feverLevelForIndex(idx: number): LevelId | null {
  if (!isFeverWindow(idx)) return null;
  return FEVER_LEVELS[(hash32(idx) >>> 8) % FEVER_LEVELS.length];
}

export function feverLevel(now: number): LevelId | null {
  return feverLevelForIndex(feverIntervalIndex(now));
}

// 今のフィーバー枠が終わる（＝入れ替わる）までの残り秒
export function feverSecondsRemaining(now: number): number {
  return Math.ceil((FEVER_INTERVAL_MS - (now % FEVER_INTERVAL_MS)) / 1000);
}

/** その枠で残っているルーレット回数（user の枠カウントから計算）。 */
export function feverUsesLeft(
  currentInterval: number,
  windowInterval: number | undefined,
  windowUses: number | undefined
): number {
  const used = windowInterval === currentInterval ? (windowUses ?? 0) : 0;
  return Math.max(0, FEVER_MAX_PER_WINDOW - used);
}
