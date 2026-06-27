// コイン計算ロジック（サーバー版・確定値）。
// 重要: app/sansu-100/lib/coins.ts と「同一ロジック」で複製している。
//       片方を変えたら必ずもう片方も変えること。
//       匿名APIのためクライアント申告は信用せず、ここで再計算した値を正とする。

export const COIN_RULES = {
  firstClearOfDay: 50,
  subsequentClear: 10,
  newBest: 20,
  streak3Bonus: 10,
  streak7Bonus: 30,
  dailyCap: 150,
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

  if (sessionCountSoFar === 0) {
    breakdown.push({ label: 'きょう1回目', amount: COIN_RULES.firstClearOfDay });
  } else {
    breakdown.push({ label: 'クリア', amount: COIN_RULES.subsequentClear });
  }

  if (ctx.isNewBest) {
    breakdown.push({ label: 'ベストこうしん', amount: COIN_RULES.newBest });
  }

  if (ctx.streakDays >= 7 && ctx.prevStreakDays < 7) {
    breakdown.push({ label: '7日れんぞく', amount: COIN_RULES.streak7Bonus });
  } else if (ctx.streakDays >= 3 && ctx.prevStreakDays < 3) {
    breakdown.push({ label: '3日れんぞく', amount: COIN_RULES.streak3Bonus });
  }

  const raw = breakdown.reduce((sum, e) => sum + e.amount, 0);

  const capRemaining = Math.max(0, COIN_RULES.dailyCap - earnedSoFar);
  const coinsEarned = Math.min(raw, capRemaining);

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
