import { describe, it, expect } from 'vitest';
import { calculateCoins, COIN_RULES, type CoinContext } from '../coins';

const base: CoinContext = {
  levelId: 1,
  dailyCoinDate: '2026-06-28',
  dailyCoinsEarned: 0,
  dailySessionCount: 0,
  todayKey: '2026-06-28',
  isNewBest: false,
  streakDays: 1,
  prevStreakDays: 0,
  isCountable: true,
};

describe('calculateCoins', () => {
  it('Lv枝番ごとに基本コインが固定値になる', () => {
    // Lv.1グループ（id1,3,5,6）= 25
    expect(calculateCoins({ ...base, levelId: 1 }).coinsEarned).toBe(25);
    expect(calculateCoins({ ...base, levelId: 3 }).coinsEarned).toBe(25);
    expect(calculateCoins({ ...base, levelId: 5 }).coinsEarned).toBe(25);
    expect(calculateCoins({ ...base, levelId: 6 }).coinsEarned).toBe(25);
    // Lv.2グループ（id2,4,10,11）= 50
    expect(calculateCoins({ ...base, levelId: 2 }).coinsEarned).toBe(50);
    expect(calculateCoins({ ...base, levelId: 4 }).coinsEarned).toBe(50);
    expect(calculateCoins({ ...base, levelId: 10 }).coinsEarned).toBe(50);
    expect(calculateCoins({ ...base, levelId: 11 }).coinsEarned).toBe(50);
    // Lv.3（id7,9）= 100
    expect(calculateCoins({ ...base, levelId: 7 }).coinsEarned).toBe(100);
    expect(calculateCoins({ ...base, levelId: 9 }).coinsEarned).toBe(100);
    // Lv.4（id8）= 200
    expect(calculateCoins({ ...base, levelId: 8 }).coinsEarned).toBe(200);
  });

  it('ミックスは50（暫定）', () => {
    expect(calculateCoins({ ...base, levelId: 'mix' }).coinsEarned).toBe(50);
  });

  it('ボーナスはレベル固定値に加算される（上限クリップなし）', () => {
    // Lv.4(200) + ベスト更新(20) = 220
    const r = calculateCoins({ ...base, levelId: 8, isNewBest: true });
    expect(r.coinsEarned).toBe(220);
    expect(r.breakdown.some((e) => e.label === '1回の上限')).toBe(false);
  });

  it('自己ベスト更新で +20 加算', () => {
    const r = calculateCoins({ ...base, levelId: 1, isNewBest: true });
    expect(r.coinsEarned).toBe(25 + COIN_RULES.newBest); // 45
  });

  it('7日連続ボーナス +30', () => {
    const r = calculateCoins({
      ...base,
      levelId: 1,
      streakDays: 7,
      prevStreakDays: 6,
    });
    expect(r.coinsEarned).toBe(25 + COIN_RULES.streak7Bonus); // 55
  });

  it('3日連続ボーナス +10（7日未満の場合のみ）', () => {
    const r = calculateCoins({
      ...base,
      levelId: 1,
      streakDays: 3,
      prevStreakDays: 2,
    });
    expect(r.coinsEarned).toBe(25 + COIN_RULES.streak3Bonus); // 35
  });

  it('リタイヤ（集計対象外）は0で当日カウンタ据え置き', () => {
    const r = calculateCoins({
      ...base,
      isCountable: false,
      dailyCoinsEarned: 80,
      dailySessionCount: 2,
    });
    expect(r.coinsEarned).toBe(0);
    expect(r.nextDailyCoinsEarned).toBe(80);
    expect(r.nextDailySessionCount).toBe(2);
  });

  it('日付が変わったら当日カウンタをリセット', () => {
    const r = calculateCoins({
      ...base,
      levelId: 8,
      dailyCoinDate: '2026-06-27',
      dailyCoinsEarned: 500,
      dailySessionCount: 8,
      todayKey: '2026-06-28',
    });
    expect(r.coinsEarned).toBe(200);
    expect(r.nextDailyCoinDate).toBe('2026-06-28');
    expect(r.nextDailySessionCount).toBe(1);
  });
});
