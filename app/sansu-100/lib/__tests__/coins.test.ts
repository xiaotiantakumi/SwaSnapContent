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
  it('1日1回目のクリアで +30', () => {
    const r = calculateCoins(base);
    expect(r.coinsEarned).toBe(30);
    expect(r.nextDailySessionCount).toBe(1);
    expect(r.nextDailyCoinsEarned).toBe(30);
    expect(r.nextDailyCoinDate).toBe('2026-06-28');
  });

  it('回数が増えるほど基本コインが +20 ずつ増える（30→50→70…）', () => {
    const second = calculateCoins({ ...base, dailySessionCount: 1, dailyCoinsEarned: 30 });
    expect(second.coinsEarned).toBe(50);
    expect(second.nextDailyCoinsEarned).toBe(80);
    const third = calculateCoins({ ...base, dailySessionCount: 2, dailyCoinsEarned: 80 });
    expect(third.coinsEarned).toBe(70);
  });

  it('1回あたりの基本コインは baseMax(150) で頭打ち', () => {
    const sixth = calculateCoins({ ...base, dailySessionCount: 6, dailyCoinsEarned: 999 });
    expect(sixth.coinsEarned).toBe(COIN_RULES.baseMax); // 30+6*20=150
    const tenth = calculateCoins({ ...base, dailySessionCount: 10, dailyCoinsEarned: 999 });
    expect(tenth.coinsEarned).toBe(COIN_RULES.baseMax);
  });

  it('1日合計の上限はない（150を超えても付与される）', () => {
    const r = calculateCoins({
      ...base,
      dailySessionCount: 5,
      dailyCoinsEarned: 400, // すでに400稼いでいても…
    });
    expect(r.coinsEarned).toBe(130); // 30+5*20=130
    expect(r.nextDailyCoinsEarned).toBe(530);
  });

  it('自己ベスト更新で +20 上乗せ', () => {
    const r = calculateCoins({ ...base, isNewBest: true });
    expect(r.coinsEarned).toBe(30 + 20);
  });

  it('3日連続に到達した日だけ +10', () => {
    const reached = calculateCoins({ ...base, streakDays: 3, prevStreakDays: 2 });
    expect(reached.coinsEarned).toBe(30 + 10);
    const already = calculateCoins({ ...base, streakDays: 4, prevStreakDays: 3 });
    expect(already.coinsEarned).toBe(30);
  });

  it('7日連続に到達した日は +30（3日分は重複しない）', () => {
    const r = calculateCoins({ ...base, streakDays: 7, prevStreakDays: 6 });
    expect(r.coinsEarned).toBe(30 + 30);
  });

  it('日付が変わったら当日カウンタをリセットして再び 1回目=30', () => {
    const r = calculateCoins({
      ...base,
      dailyCoinDate: '2026-06-27',
      dailyCoinsEarned: 500,
      dailySessionCount: 8,
      todayKey: '2026-06-28',
    });
    expect(r.coinsEarned).toBe(30);
    expect(r.nextDailyCoinDate).toBe('2026-06-28');
    expect(r.nextDailyCoinsEarned).toBe(30);
    expect(r.nextDailySessionCount).toBe(1);
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
    expect(r.nextDailyCoinDate).toBe(base.dailyCoinDate);
  });
});
