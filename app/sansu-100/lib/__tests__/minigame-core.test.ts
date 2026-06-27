import { describe, it, expect } from 'vitest';
import {
  advance,
  nextDirection,
  isOpposite,
  dirFromKey,
  isActionKey,
  tickIntervalForScore,
  DIR_VECTORS,
} from '../minigame-core';

describe('minigame-core: advance (fixed timestep)', () => {
  it('converts elapsed time into the right number of steps', () => {
    expect(advance(0, 100, 100)).toEqual({ steps: 1, remainder: 0 });
    expect(advance(0, 250, 100)).toEqual({ steps: 2, remainder: 50 });
    expect(advance(0, 99, 100)).toEqual({ steps: 0, remainder: 99 });
  });

  it('carries the remainder across calls', () => {
    const a = advance(0, 60, 100); // 0 steps, 60 left
    expect(a.steps).toBe(0);
    const b = advance(a.remainder, 60, 100); // 120 -> 1 step, 20 left
    expect(b).toEqual({ steps: 1, remainder: 20 });
  });

  it('caps steps so a long frame drop does not snowball', () => {
    const r = advance(0, 100_000, 100, 5);
    expect(r.steps).toBe(5);
    expect(r.remainder).toBeLessThan(100);
  });

  it('ignores invalid deltas', () => {
    expect(advance(30, -5, 100)).toEqual({ steps: 0, remainder: 30 });
    expect(advance(30, NaN, 100)).toEqual({ steps: 0, remainder: 30 });
  });

  it('returns no steps for non-positive stepMs', () => {
    expect(advance(0, 100, 0)).toEqual({ steps: 0, remainder: 0 });
  });
});

describe('minigame-core: directions', () => {
  it('detects opposite directions', () => {
    expect(isOpposite('up', 'down')).toBe(true);
    expect(isOpposite('left', 'up')).toBe(false);
  });

  it('ignores 180-degree reversals', () => {
    expect(nextDirection('right', 'left')).toBe('right');
    expect(nextDirection('right', 'up')).toBe('up');
    expect(nextDirection('up', 'up')).toBe('up');
  });

  it('maps direction vectors consistently', () => {
    expect(DIR_VECTORS.up).toEqual({ x: 0, y: -1 });
    expect(DIR_VECTORS.right).toEqual({ x: 1, y: 0 });
  });
});

describe('minigame-core: input mapping', () => {
  it('maps arrow and WASD keys to directions', () => {
    expect(dirFromKey('ArrowLeft')).toBe('left');
    expect(dirFromKey('w')).toBe('up');
    expect(dirFromKey('D')).toBe('right');
    expect(dirFromKey('x')).toBeUndefined();
  });

  it('recognizes action keys (jump/start)', () => {
    expect(isActionKey(' ')).toBe(true);
    expect(isActionKey('ArrowUp')).toBe(true);
    expect(isActionKey('x')).toBe(false);
  });
});

describe('minigame-core: difficulty curve', () => {
  it('speeds up as score grows, clamped to minMs', () => {
    const opts = { baseMs: 200, minMs: 80, scorePerSpeedup: 5, stepDownMs: 20 };
    expect(tickIntervalForScore(0, opts)).toBe(200);
    expect(tickIntervalForScore(5, opts)).toBe(180);
    expect(tickIntervalForScore(12, opts)).toBe(160); // floor(12/5)=2 -> 200-40
    expect(tickIntervalForScore(1000, opts)).toBe(80); // clamped
  });
});
