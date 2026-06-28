// 「フィーバー(おすすめ)レベル」を時刻から決める純粋ロジック。
// 15分ごとに全員共通で入れ替わる（UTCの絶対時刻ベース＝時差非依存）。
// 重要: api/src/shared/fever.ts と「同一ロジック」で複製している（client/server一致）。

import type { LevelId } from './types';

export const FEVER_INTERVAL_MS = 15 * 60 * 1000; // 15分

// フィーバー対象になりうる具体レベル（mix は除外）
const FEVER_LEVELS: readonly LevelId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

// ルーレットの倍率候補
export const FEVER_MULTIPLIERS = [2, 3] as const;

// 同じ15分枠でルーレットを回せる回数
export const FEVER_MAX_PER_WINDOW = 3;

/** その枠で残っているルーレット回数（user の枠カウントから計算）。 */
export function feverUsesLeft(
  currentInterval: number,
  windowInterval: number | undefined,
  windowUses: number | undefined
): number {
  const used = windowInterval === currentInterval ? (windowUses ?? 0) : 0;
  return Math.max(0, FEVER_MAX_PER_WINDOW - used);
}

export function feverIntervalIndex(now: number): number {
  return Math.floor(now / FEVER_INTERVAL_MS);
}

// idx を xorshift32 でかき混ぜて1レベルを決める（決定的・client/server一致）。
export function feverLevelForIndex(idx: number): LevelId {
  let x = (idx + 1) >>> 0;
  x ^= x << 13;
  x >>>= 0;
  x ^= x >>> 17;
  x ^= x << 5;
  x >>>= 0;
  return FEVER_LEVELS[x % FEVER_LEVELS.length];
}

export function feverLevel(now: number): LevelId {
  return feverLevelForIndex(feverIntervalIndex(now));
}

// 次の入れ替わりまでの残り秒
export function feverSecondsRemaining(now: number): number {
  return Math.ceil((FEVER_INTERVAL_MS - (now % FEVER_INTERVAL_MS)) / 1000);
}
