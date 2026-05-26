import { describe, it, expect } from 'vitest';
import { todayKey, dailySeed, dailyLevel } from '../daily';
import { generateSetSeeded } from '../problem-generator';

describe('daily challenge', () => {
  it('todayKey produces YYYY-MM-DD', () => {
    expect(todayKey(new Date('2026-05-25T10:00:00'))).toBe('2026-05-25');
  });

  it('same date produces same seed', () => {
    const d1 = new Date('2026-05-25T01:00:00');
    const d2 = new Date('2026-05-25T23:00:00');
    expect(dailySeed(d1)).toBe(dailySeed(d2));
  });

  it('different dates produce different seeds', () => {
    expect(dailySeed(new Date('2026-05-25'))).not.toBe(
      dailySeed(new Date('2026-05-26'))
    );
  });

  it('daily problem set is reproducible', () => {
    const seed = dailySeed(new Date('2026-05-25'));
    const level = dailyLevel(new Date('2026-05-25'));
    const a = generateSetSeeded(level as 1, 100, seed);
    const b = generateSetSeeded(level as 1, 100, seed);
    expect(a).toEqual(b);
  });

  it('dailyLevel returns a valid level number 1-11', () => {
    for (let d = 0; d < 30; d++) {
      const date = new Date(2026, 0, 1 + d);
      const lvl = dailyLevel(date);
      expect(lvl).toBeGreaterThanOrEqual(1);
      expect(lvl).toBeLessThanOrEqual(11);
    }
  });
});
