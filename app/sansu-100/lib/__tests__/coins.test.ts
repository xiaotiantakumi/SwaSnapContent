import { describe, it, expect } from 'vitest';
import { calculateCoins, COIN_RULES, type CoinContext } from '../coins';

const base: CoinContext = {
  operation: 'add',
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
  it('演算の難しさで基本コインが変わる（add<sub<mul<div）', () => {
    const add = calculateCoins({ ...base, operation: 'add' }).coinsEarned;
    const sub = calculateCoins({ ...base, operation: 'sub' }).coinsEarned;
    const mul = calculateCoins({ ...base, operation: 'mul' }).coinsEarned;
    const div = calculateCoins({ ...base, operation: 'div' }).coinsEarned;
    expect(add).toBe(COIN_RULES.byOperation.add); // 10
    expect(sub).toBe(COIN_RULES.byOperation.sub);
    expect(mul).toBe(COIN_RULES.byOperation.mul);
    expect(div).toBe(COIN_RULES.byOperation.div); // 90
    expect(add).toBeLessThan(sub);
    expect(sub).toBeLessThan(mul);
    expect(mul).toBeLessThan(div);
  });

  it('最小は10・最大は100（1回あたり）', () => {
    expect(calculateCoins({ ...base, operation: 'add' }).coinsEarned).toBe(10);
    // div(90)+ベスト(20)+ストリーク → 100で頭打ち
    const capped = calculateCoins({
      ...base,
      operation: 'div',
      isNewBest: true,
      streakDays: 7,
      prevStreakDays: 6,
    });
    expect(capped.coinsEarned).toBe(COIN_RULES.maxPerSession); // 100
    expect(capped.coinsEarned).toBeLessThanOrEqual(100);
    expect(capped.breakdown.some((e) => e.label === '1回の上限')).toBe(true);
  });

  it('自己ベスト更新で +20（上限内）', () => {
    const r = calculateCoins({ ...base, operation: 'add', isNewBest: true });
    expect(r.coinsEarned).toBe(COIN_RULES.byOperation.add + 20);
  });

  it('ミックスは中くらい', () => {
    const mixed = calculateCoins({ ...base, operation: 'mixed' }).coinsEarned;
    expect(mixed).toBe(COIN_RULES.byOperation.mixed);
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
      operation: 'div',
      dailyCoinDate: '2026-06-27',
      dailyCoinsEarned: 500,
      dailySessionCount: 8,
      todayKey: '2026-06-28',
    });
    expect(r.coinsEarned).toBe(COIN_RULES.byOperation.div);
    expect(r.nextDailyCoinDate).toBe('2026-06-28');
    expect(r.nextDailySessionCount).toBe(1);
  });
});
