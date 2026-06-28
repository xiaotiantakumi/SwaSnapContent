// コイン計算ロジック（クライアント版）。
// 重要: api/src/shared/coins.ts と「同一ロジック」で複製している。
//       片方を変えたら必ずもう片方も変えること。確定値はサーバー側。
//       挙動の一致は app/sansu-100/lib/__tests__/coins.test.ts で担保する。
//
// 子ども向け配慮: 減点・没収は一切しない（常に coinsEarned >= 0）。1日の上限はなし。
// 基本コインは「演算の難しさ」で決まる（たし算<ひき算<かけ算<わり算）。1回あたり最大100。
// ※フィーバーのルーレット倍率は別枠で、この上限の対象外。

import type { Operation } from './types';

export const COIN_RULES = {
  // 演算ごとの基本コイン（調整しやすいよう変数化）。最小10〜。
  byOperation: { add: 10, sub: 35, mul: 60, div: 90, mixed: 50 } as Record<
    Operation,
    number
  >,
  maxPerSession: 100, // 1回あたりの上限（ルーレット倍率は対象外）
  newBest: 20, // 自己ベスト更新ボーナス
  streak3Bonus: 10, // 3日連続に到達した日
  streak7Bonus: 30, // 7日連続に到達した日
} as const;

const OP_LABEL: Record<Operation, string> = {
  add: 'たしざん',
  sub: 'ひきざん',
  mul: 'かけざん',
  div: 'わりざん',
  mixed: 'ミックス',
};

export type CoinBreakdownEntry = { label: string; amount: number };

export type CoinContext = {
  /** 今回の演算（たし算/ひき算/かけ算/わり算/ミックス）。基本コインを決める。 */
  operation: Operation;
  /** 当日コイン集計の対象日（ユーザーの現在値）。todayKey と異なれば日付跨ぎ。 */
  dailyCoinDate: string;
  /** 当日すでに獲得したコイン（ユーザーの現在値）。 */
  dailyCoinsEarned: number;
  /** 当日のクリア回数（ユーザーの現在値。今回クリアを足す前）。 */
  dailySessionCount: number;
  /** 今回プレイ日 YYYY-MM-DD。 */
  todayKey: string;
  /** 今回が自己ベスト更新か。 */
  isNewBest: boolean;
  /** 今回クリア後の連続日数。 */
  streakDays: number;
  /** クリア前の連続日数（到達日ボーナスの判定用）。 */
  prevStreakDays: number;
  /** 集計対象か（リタイヤ=途中終了は false）。 */
  isCountable: boolean;
};

export type CoinResult = {
  coinsEarned: number;
  breakdown: CoinBreakdownEntry[];
  nextDailyCoinDate: string;
  nextDailyCoinsEarned: number;
  nextDailySessionCount: number;
};

export function calculateCoins(ctx: CoinContext): CoinResult {
  // リタイヤは加算なし。当日カウンタも据え置く。
  if (!ctx.isCountable) {
    return {
      coinsEarned: 0,
      breakdown: [],
      nextDailyCoinDate: ctx.dailyCoinDate,
      nextDailyCoinsEarned: ctx.dailyCoinsEarned,
      nextDailySessionCount: ctx.dailySessionCount,
    };
  }

  const sameDay = ctx.dailyCoinDate === ctx.todayKey;
  const earnedSoFar = sameDay ? ctx.dailyCoinsEarned : 0;
  const sessionCountSoFar = sameDay ? ctx.dailySessionCount : 0;

  const breakdown: CoinBreakdownEntry[] = [];

  // 基本報酬: 演算の難しさで決まる
  const base = COIN_RULES.byOperation[ctx.operation] ?? COIN_RULES.byOperation.mixed;
  breakdown.push({ label: OP_LABEL[ctx.operation] ?? 'クリア', amount: base });

  // 自己ベスト更新
  if (ctx.isNewBest) {
    breakdown.push({ label: 'ベストこうしん', amount: COIN_RULES.newBest });
  }

  // ストリーク到達ボーナス（ちょうどその日数に到達したクリアで1回だけ）
  if (ctx.streakDays >= 7 && ctx.prevStreakDays < 7) {
    breakdown.push({ label: '7日れんぞく', amount: COIN_RULES.streak7Bonus });
  } else if (ctx.streakDays >= 3 && ctx.prevStreakDays < 3) {
    breakdown.push({ label: '3日れんぞく', amount: COIN_RULES.streak3Bonus });
  }

  const raw = breakdown.reduce((sum, e) => sum + e.amount, 0);
  // 1回あたりの上限でクリップ（ルーレット倍率は別枠で対象外）。
  const coinsEarned = Math.min(COIN_RULES.maxPerSession, raw);
  if (coinsEarned < raw) {
    breakdown.push({ label: '1回の上限', amount: coinsEarned - raw });
  }

  return {
    coinsEarned,
    breakdown,
    nextDailyCoinDate: ctx.todayKey,
    nextDailyCoinsEarned: earnedSoFar + coinsEarned,
    nextDailySessionCount: sessionCountSoFar + 1,
  };
}
