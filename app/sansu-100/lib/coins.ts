// コイン計算ロジック（クライアント版）。
// 重要: api/src/shared/coins.ts と「同一ロジック」で複製している。
//       片方を変えたら必ずもう片方も変えること。確定値はサーバー側。
//       挙動の一致は app/sansu-100/lib/__tests__/coins.test.ts で担保する。
//
// 子ども向け配慮: 減点・没収は一切しない（常に coinsEarned >= 0）。
// 基本コインは「単元内のLv枝番」で固定。ベスト更新・連続ボーナスはその上に加算（上限クリップなし）。
// ※フィーバーのルーレット倍率は別枠。

import type { LevelId } from './types';

// 単元内Lv枝番 → 基本コイン
// Lv.1=25: id1(たし算Lv.1), id3(ひき算Lv.1), id5(かけ算九九), id6(わり算Lv.1)
// Lv.2=50: id2(たし算Lv.2), id4(ひき算Lv.2), id10(かけ算Lv.2), id11(わり算Lv.2)
// Lv.3=100: id7(たし算Lv.3), id9(ひき算Lv.3)
// Lv.4=200: id8(たし算Lv.4)
// mix=50: 暫定（単元内Lv枝番が定まらない）
const COINS_BY_LEVEL: Record<LevelId, number> = {
  1: 25,
  2: 50,
  3: 25,
  4: 50,
  5: 25,
  6: 25,
  7: 100,
  8: 200,
  9: 100,
  10: 50,
  11: 50,
  mix: 50,
};

export const COIN_RULES = {
  byLevel: COINS_BY_LEVEL,
  newBest: 20, // 自己ベスト更新ボーナス
  streak3Bonus: 10, // 3日連続に到達した日
  streak7Bonus: 30, // 7日連続に到達した日
} as const;

export type CoinBreakdownEntry = { label: string; amount: number };

export type CoinContext = {
  /** 今回プレイしたレベルID。基本コインを決める。 */
  levelId: LevelId;
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

  // 基本報酬: 単元内のLv枝番で固定（上限クリップなし）
  const base = COIN_RULES.byLevel[ctx.levelId] ?? 50;
  breakdown.push({ label: 'クリア', amount: base });

  // 自己ベスト更新（別枠加算）
  if (ctx.isNewBest) {
    breakdown.push({ label: 'ベストこうしん', amount: COIN_RULES.newBest });
  }

  // ストリーク到達ボーナス（ちょうどその日数に到達したクリアで1回だけ）
  if (ctx.streakDays >= 7 && ctx.prevStreakDays < 7) {
    breakdown.push({ label: '7日れんぞく', amount: COIN_RULES.streak7Bonus });
  } else if (ctx.streakDays >= 3 && ctx.prevStreakDays < 3) {
    breakdown.push({ label: '3日れんぞく', amount: COIN_RULES.streak3Bonus });
  }

  const coinsEarned = breakdown.reduce((sum, e) => sum + e.amount, 0);

  return {
    coinsEarned,
    breakdown,
    nextDailyCoinDate: ctx.todayKey,
    nextDailyCoinsEarned: earnedSoFar + coinsEarned,
    nextDailySessionCount: sessionCountSoFar + 1,
  };
}
