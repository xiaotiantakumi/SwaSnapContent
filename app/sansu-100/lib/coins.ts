// コイン計算ロジック（クライアント版）。
// 重要: api/src/shared/coins.ts と「同一ロジック」で複製している。
//       片方を変えたら必ずもう片方も変えること。確定値はサーバー側。
//       挙動の一致は app/sansu-100/lib/__tests__/coins.test.ts で担保する。
//
// 子ども向け配慮: 減点・没収は一切しない（常に coinsEarned >= 0）。
//                 1日の獲得上限を設けて「短時間の毎日の習慣」を促す。

export const COIN_RULES = {
  firstClearOfDay: 50, // 1日1回目のクリア
  subsequentClear: 10, // 2回目以降のクリア
  newBest: 20, // 自己ベスト更新
  streak3Bonus: 10, // 3日連続に到達した日
  streak7Bonus: 30, // 7日連続に到達した日
  dailyCap: 150, // 1日に計算で稼げる上限
} as const;

export type CoinBreakdownEntry = { label: string; amount: number };

export type CoinContext = {
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
  // 反映後の当日カウンタ（呼び出し側がユーザーに保存する）
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

  // 日付が変わっていたら当日カウンタをリセット。
  const sameDay = ctx.dailyCoinDate === ctx.todayKey;
  const earnedSoFar = sameDay ? ctx.dailyCoinsEarned : 0;
  const sessionCountSoFar = sameDay ? ctx.dailySessionCount : 0;

  const breakdown: CoinBreakdownEntry[] = [];

  // 基本報酬（1日1回目 or 2回目以降）
  if (sessionCountSoFar === 0) {
    breakdown.push({ label: 'きょう1回目', amount: COIN_RULES.firstClearOfDay });
  } else {
    breakdown.push({ label: 'クリア', amount: COIN_RULES.subsequentClear });
  }

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

  // 1日上限でクリップ（残り上限まで）。減点はしない。
  const capRemaining = Math.max(0, COIN_RULES.dailyCap - earnedSoFar);
  const coinsEarned = Math.min(raw, capRemaining);

  // 上限で削られた分を表示に反映
  if (coinsEarned < raw) {
    breakdown.push({ label: '1日上限', amount: coinsEarned - raw });
  }

  return {
    coinsEarned,
    breakdown,
    nextDailyCoinDate: ctx.todayKey,
    nextDailyCoinsEarned: earnedSoFar + coinsEarned,
    nextDailySessionCount: sessionCountSoFar + 1,
  };
}
