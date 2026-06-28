// コイン計算ロジック（サーバー版・確定値）。
// 重要: app/sansu-100/lib/coins.ts と「同一ロジック」で複製している。
//       片方を変えたら必ずもう片方も変えること。
//       匿名APIのためクライアント申告は信用せず、ここで再計算した値を正とする。

export const COIN_RULES = {
  baseStart: 30, // その日1回目の基本コイン
  baseStep: 20, // 1回ふえるごとに +20
  baseMax: 150, // 1回あたりの基本コインの上限（1日合計の上限はなし）
  newBest: 20,
  streak3Bonus: 10,
  streak7Bonus: 30,
} as const;

export type CoinBreakdownEntry = { label: string; amount: number };

export type CoinContext = {
  dailyCoinDate: string;
  dailyCoinsEarned: number;
  dailySessionCount: number;
  todayKey: string;
  isNewBest: boolean;
  streakDays: number;
  prevStreakDays: number;
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

  const base = Math.min(
    COIN_RULES.baseMax,
    COIN_RULES.baseStart + sessionCountSoFar * COIN_RULES.baseStep
  );
  breakdown.push({ label: `きょう${sessionCountSoFar + 1}回目`, amount: base });

  if (ctx.isNewBest) {
    breakdown.push({ label: 'ベストこうしん', amount: COIN_RULES.newBest });
  }

  if (ctx.streakDays >= 7 && ctx.prevStreakDays < 7) {
    breakdown.push({ label: '7日れんぞく', amount: COIN_RULES.streak7Bonus });
  } else if (ctx.streakDays >= 3 && ctx.prevStreakDays < 3) {
    breakdown.push({ label: '3日れんぞく', amount: COIN_RULES.streak3Bonus });
  }

  // 1日の上限はなし（やるほど増える）。
  const coinsEarned = breakdown.reduce((sum, e) => sum + e.amount, 0);

  return {
    coinsEarned,
    breakdown,
    nextDailyCoinDate: ctx.todayKey,
    nextDailyCoinsEarned: earnedSoFar + coinsEarned,
    nextDailySessionCount: sessionCountSoFar + 1,
  };
}
