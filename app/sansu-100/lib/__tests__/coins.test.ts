import { describe, it, expect } from 'vitest';
import { calculateCoins, COIN_RULES, type CoinContext } from '../coins';

const base: CoinContext = {
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
  it('1日1回目のクリアで +50', () => {
    const r = calculateCoins(base);
    expect(r.coinsEarned).toBe(50);
    expect(r.nextDailySessionCount).toBe(1);
    expect(r.nextDailyCoinsEarned).toBe(50);
    expect(r.nextDailyCoinDate).toBe('2026-06-28');
  });

  it('2回目以降のクリアで +10', () => {
    const r = calculateCoins({
      ...base,
      dailyCoinsEarned: 50,
      dailySessionCount: 1,
    });
    expect(r.coinsEarned).toBe(10);
    expect(r.nextDailyCoinsEarned).toBe(60);
    expect(r.nextDailySessionCount).toBe(2);
  });

  it('自己ベスト更新で +20 上乗せ', () => {
    const r = calculateCoins({ ...base, isNewBest: true });
    expect(r.coinsEarned).toBe(50 + 20);
  });

  it('3日連続に到達した日だけ +10', () => {
    const reached = calculateCoins({
      ...base,
      streakDays: 3,
      prevStreakDays: 2,
    });
    expect(reached.coinsEarned).toBe(50 + 10);
    // すでに3日を超えている日は付かない
    const already = calculateCoins({
      ...base,
      streakDays: 4,
      prevStreakDays: 3,
    });
    expect(already.coinsEarned).toBe(50);
  });

  it('7日連続に到達した日は +30（3日分は重複しない）', () => {
    const r = calculateCoins({ ...base, streakDays: 7, prevStreakDays: 6 });
    expect(r.coinsEarned).toBe(50 + 30);
  });

  it('1日上限150を超えない（残り分だけ付与）', () => {
    const r = calculateCoins({
      ...base,
      dailyCoinsEarned: 145,
      dailySessionCount: 5,
      isNewBest: true, // raw=10+20=30 だが残り5しか付かない
    });
    expect(r.coinsEarned).toBe(5);
    expect(r.nextDailyCoinsEarned).toBe(COIN_RULES.dailyCap);
    // 上限到達の説明エントリが入る
    expect(r.breakdown.some((e) => e.label === '1日上限')).toBe(true);
  });

  it('上限に達していると0（マイナスにはならない）', () => {
    const r = calculateCoins({
      ...base,
      dailyCoinsEarned: 150,
      dailySessionCount: 6,
    });
    expect(r.coinsEarned).toBe(0);
    expect(r.coinsEarned).toBeGreaterThanOrEqual(0);
  });

  it('日付が変わったら当日カウンタをリセットして再び +50', () => {
    const r = calculateCoins({
      ...base,
      dailyCoinDate: '2026-06-27', // 前日
      dailyCoinsEarned: 150,
      dailySessionCount: 8,
      todayKey: '2026-06-28',
    });
    expect(r.coinsEarned).toBe(50);
    expect(r.nextDailyCoinDate).toBe('2026-06-28');
    expect(r.nextDailyCoinsEarned).toBe(50);
    expect(r.nextDailySessionCount).toBe(1);
  });

  it('リタイヤ（集計対象外）は0で当日カウンタ据え置き', () => {
    const r = calculateCoins({
      ...base,
      isCountable: false,
      dailyCoinsEarned: 60,
      dailySessionCount: 2,
    });
    expect(r.coinsEarned).toBe(0);
    expect(r.nextDailyCoinsEarned).toBe(60);
    expect(r.nextDailySessionCount).toBe(2);
    expect(r.nextDailyCoinDate).toBe(base.dailyCoinDate);
  });
});
