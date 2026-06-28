import { describe, it, expect } from 'vitest';
import {
  generateSet,
  generateSetSeeded,
  hashStringToSeed,
  mulberry32,
} from '../problem-generator';
import { LEVELS, getLevel } from '../levels';
import type { LevelId } from '../types';

describe('problem-generator', () => {
  it('generates the requested number of problems per level', () => {
    for (const level of LEVELS) {
      const rng = mulberry32(42);
      const set = generateSet(level.id, 100, rng);
      expect(set).toHaveLength(100);
    }
  });

  it('Level 1: addition without carry, answer 0-9', () => {
    const set = generateSetSeeded(1, 200, 1);
    for (const p of set) {
      expect(p.op).toBe('add');
      expect(p.a + p.b).toBe(p.answer);
      expect(p.answer).toBeLessThanOrEqual(9);
      expect((p.a % 10) + (p.b % 10)).toBeLessThan(10);
    }
  });

  it('Level 2: addition with carry, answer 10-18', () => {
    const set = generateSetSeeded(2, 200, 2);
    for (const p of set) {
      expect(p.op).toBe('add');
      expect(p.answer).toBeGreaterThanOrEqual(10);
      expect(p.answer).toBeLessThanOrEqual(18);
    }
  });

  it('Level 3: subtraction non-negative, no borrow', () => {
    const set = generateSetSeeded(3, 200, 3);
    for (const p of set) {
      expect(p.op).toBe('sub');
      expect(p.answer).toBeGreaterThanOrEqual(0);
      expect(p.a - p.b).toBe(p.answer);
    }
  });

  it('Level 4: subtraction with borrow, non-negative', () => {
    const set = generateSetSeeded(4, 200, 4);
    for (const p of set) {
      expect(p.op).toBe('sub');
      expect(p.answer).toBeGreaterThanOrEqual(0);
      expect(p.a).toBeGreaterThanOrEqual(10);
      expect(p.a).toBeLessThanOrEqual(18);
    }
  });

  it('Level 5: multiplication 1-9 × 1-9 (九九)', () => {
    const set = generateSetSeeded(5, 200, 5);
    for (const p of set) {
      expect(p.op).toBe('mul');
      expect(p.a).toBeGreaterThanOrEqual(1);
      expect(p.a).toBeLessThanOrEqual(9);
      expect(p.b).toBeGreaterThanOrEqual(1);
      expect(p.b).toBeLessThanOrEqual(9);
      expect(p.a * p.b).toBe(p.answer);
    }
  });

  it('Level 6: division with no remainder', () => {
    const set = generateSetSeeded(6, 200, 6);
    for (const p of set) {
      expect(p.op).toBe('div');
      expect(p.a % p.b).toBe(0);
      expect(p.answer).toBe(p.a / p.b);
    }
  });

  it('Level 7: 2-digit + 1-digit addition', () => {
    const set = generateSetSeeded(7, 200, 7);
    for (const p of set) {
      expect(p.op).toBe('add');
      expect(p.a).toBeGreaterThanOrEqual(10);
      expect(p.a).toBeLessThanOrEqual(99);
      expect(p.b).toBeGreaterThanOrEqual(1);
      expect(p.b).toBeLessThanOrEqual(9);
    }
  });

  it('Level 8: 2-digit + 2-digit', () => {
    const set = generateSetSeeded(8, 200, 8);
    for (const p of set) {
      expect(p.a).toBeGreaterThanOrEqual(10);
      expect(p.b).toBeGreaterThanOrEqual(10);
    }
  });

  it('Level 9: 2-digit - 2-digit, non-negative', () => {
    const set = generateSetSeeded(9, 200, 9);
    for (const p of set) {
      expect(p.op).toBe('sub');
      expect(p.answer).toBeGreaterThanOrEqual(0);
      expect(p.a).toBeGreaterThanOrEqual(p.b);
    }
  });

  it('Level 10: 2-digit × 1-digit', () => {
    const set = generateSetSeeded(10, 200, 10);
    for (const p of set) {
      expect(p.op).toBe('mul');
      expect(p.a).toBeGreaterThanOrEqual(10);
      expect(p.b).toBeGreaterThanOrEqual(2);
      expect(p.b).toBeLessThanOrEqual(9);
    }
  });

  it('Level 11: 2-digit ÷ 1-digit with remainder (always non-zero)', () => {
    const set = generateSetSeeded(11, 200, 11);
    for (const p of set) {
      expect(p.op).toBe('div');
      expect(p.answer).toBe(Math.floor(p.a / p.b));
      // あまりあり: remainder が設定され、必ず 1 以上（割り切れる問題は出さない）
      expect(p.remainder).toBe(p.a % p.b);
      expect(p.remainder ?? 0).toBeGreaterThan(0);
      expect(p.a).toBe(p.answer * p.b + (p.remainder ?? 0));
    }
  });

  it('mix level pulls from multiple levels', () => {
    const set = generateSetSeeded('mix' as LevelId, 200, 12);
    const ops = new Set(set.map((p) => p.op));
    expect(ops.size).toBeGreaterThan(1);
  });

  it('seeded RNG is deterministic', () => {
    const a = generateSetSeeded(5, 100, 999);
    const b = generateSetSeeded(5, 100, 999);
    expect(a).toEqual(b);
  });

  it('different seeds produce different sets', () => {
    const a = generateSetSeeded(5, 100, 1);
    const b = generateSetSeeded(5, 100, 2);
    expect(a).not.toEqual(b);
  });

  it('hashStringToSeed produces deterministic seed', () => {
    expect(hashStringToSeed('hello')).toBe(hashStringToSeed('hello'));
    expect(hashStringToSeed('hello')).not.toBe(hashStringToSeed('world'));
  });

  it('all LEVELS are well-defined', () => {
    for (const level of LEVELS) {
      expect(getLevel(level.id)).toBe(level);
      expect(level.rangeA[0]).toBeLessThanOrEqual(level.rangeA[1]);
      expect(level.rangeB[0]).toBeLessThanOrEqual(level.rangeB[1]);
    }
  });
});
