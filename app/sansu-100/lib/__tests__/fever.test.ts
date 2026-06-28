import { describe, it, expect } from 'vitest';

import {
  feverLevel,
  feverLevelForIndex,
  feverIntervalIndex,
  feverSecondsRemaining,
  isFeverWindow,
  FEVER_INTERVAL_MS,
  FEVER_ODDS,
} from '../fever';

describe('fever', () => {
  it('ほとんどの枠はフィーバーでない（null）', () => {
    let feverCount = 0;
    const total = 1200;
    for (let i = 0; i < total; i++) {
      if (feverLevelForIndex(i) !== null) feverCount++;
    }
    // だいたい 1/FEVER_ODDS（1200/12=100）。広めに 40〜180 を許容
    expect(feverCount).toBeGreaterThan(40);
    expect(feverCount).toBeLessThan(180);
  });

  it('フィーバー枠ならレベルは1〜11、そうでなければ null', () => {
    for (let i = 0; i < 500; i++) {
      const lv = feverLevelForIndex(i);
      if (lv === null) {
        expect(isFeverWindow(i)).toBe(false);
      } else {
        expect(isFeverWindow(i)).toBe(true);
        expect(lv).toBeGreaterThanOrEqual(1);
        expect(lv).toBeLessThanOrEqual(11);
      }
    }
  });

  it('同じ5分枠なら同じ結果', () => {
    const t0 = 1_700_000_000_000;
    expect(feverLevel(t0)).toBe(feverLevel(t0 + 60_000));
  });

  it('intervalIndex は5分ごとに増える', () => {
    expect(feverIntervalIndex(5 * FEVER_INTERVAL_MS + 1234)).toBe(5);
    expect(feverIntervalIndex(6 * FEVER_INTERVAL_MS)).toBe(6);
  });

  it('残り秒は 1..300（5分）の範囲', () => {
    const r = feverSecondsRemaining(3 * FEVER_INTERVAL_MS + 60_000);
    expect(r).toBeGreaterThan(0);
    expect(r).toBeLessThanOrEqual(300);
  });

  it('FEVER_ODDS は約1時間に1回(12)を狙う', () => {
    expect(FEVER_ODDS).toBe(12);
  });
});
