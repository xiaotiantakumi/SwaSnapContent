// コイン計算ロジック（サーバー版・確定値）。
// 重要: app/sansu-100/lib/coins.ts と「同一ロジック」で複製している。
//       片方を変えたら必ずもう片方も変えること。
//       匿名APIのためクライアント申告は信用せず、ここで再計算した値を正とする。
// 基本コインは単元内のLv枝番で固定。ベスト更新・連続ボーナスはその上に加算（上限クリップなし）。
// ルーレット倍率は別枠。

type LevelId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 'mix';

// 単元内Lv枝番 → 基本コイン
// Lv.1=25: id1, id3, id5, id6 / Lv.2=50: id2, id4, id10, id11
// Lv.3=100: id7, id9 / Lv.4=200: id8 / mix=50（暫定）
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
  newBest: 20,
  streak3Bonus: 10,
  streak7Bonus: 30,
} as const;

export type CoinBreakdownEntry = { label: string; amount: number };

export type CoinContext = {
  levelId: LevelId;
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

  const base = COIN_RULES.byLevel[ctx.levelId] ?? 50;
  breakdown.push({ label: 'クリア', amount: base });

  if (ctx.isNewBest) {
    breakdown.push({ label: 'ベストこうしん', amount: COIN_RULES.newBest });
  }

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
