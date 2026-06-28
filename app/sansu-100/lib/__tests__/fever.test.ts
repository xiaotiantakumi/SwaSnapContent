import { describe, it, expect } from 'vitest';

import {
  feverLevel,
  feverLevelForIndex,
  feverIntervalIndex,
  feverSecondsRemaining,
  FEVER_INTERVAL_MS,
} from '../fever';

describe('fever', () => {
  it('同じ15分枠なら同じレベル', () => {
    const t0 = 1_700_000_000_000;
    expect(feverLevel(t0)).toBe(feverLevel(t0 + 60_000));
  });

  it('連続する枠ではレベルがよく入れ替わる', () => {
    const lvls = new Set<number>();
    for (let i = 0; i < 12; i++) lvls.add(feverLevelForIndex(1000 + i) as number);
    expect(lvls.size).toBeGreaterThan(2);
  });

  it('レベルは常に1〜11', () => {
    for (let i = 0; i < 100; i++) {
      const lv = feverLevelForIndex(i) as number;
      expect(lv).toBeGreaterThanOrEqual(1);
      expect(lv).toBeLessThanOrEqual(11);
    }
  });

  it('intervalIndex は15分ごとに増える', () => {
    expect(feverIntervalIndex(5 * FEVER_INTERVAL_MS + 1234)).toBe(5);
    expect(feverIntervalIndex(6 * FEVER_INTERVAL_MS)).toBe(6);
  });

  it('残り秒は 1..900 の範囲', () => {
    const r = feverSecondsRemaining(3 * FEVER_INTERVAL_MS + 60_000);
    expect(r).toBeGreaterThan(0);
    expect(r).toBeLessThanOrEqual(900);
  });
});
