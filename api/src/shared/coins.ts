// コイン計算ロジック（サーバー版・確定値）。
// 重要: app/sansu-100/lib/coins.ts と「同一ロジック」で複製している。
//       片方を変えたら必ずもう片方も変えること。
//       匿名APIのためクライアント申告は信用せず、ここで再計算した値を正とする。
// 基本コインは演算の難しさで決まる（add<sub<mul<div）。1回あたり最大100。
// ルーレット倍率は別枠で上限の対象外。

type Operation = 'add' | 'sub' | 'mul' | 'div' | 'mixed';

export const COIN_RULES = {
  byOperation: { add: 10, sub: 35, mul: 60, div: 90, mixed: 50 } as Record<
    Operation,
    number
  >,
  maxPerSession: 100,
  newBest: 20,
  streak3Bonus: 10,
  streak7Bonus: 30,
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
  operation: Operation;
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

  const base =
    COIN_RULES.byOperation[ctx.operation] ?? COIN_RULES.byOperation.mixed;
  breakdown.push({ label: OP_LABEL[ctx.operation] ?? 'クリア', amount: base });

  if (ctx.isNewBest) {
    breakdown.push({ label: 'ベストこうしん', amount: COIN_RULES.newBest });
  }

  if (ctx.streakDays >= 7 && ctx.prevStreakDays < 7) {
    breakdown.push({ label: '7日れんぞく', amount: COIN_RULES.streak7Bonus });
  } else if (ctx.streakDays >= 3 && ctx.prevStreakDays < 3) {
    breakdown.push({ label: '3日れんぞく', amount: COIN_RULES.streak3Bonus });
  }

  const raw = breakdown.reduce((sum, e) => sum + e.amount, 0);
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
