import { describe, it, expect } from 'vitest';
import { createFlappy, stepFlappy, FLAPPY } from '../games/flappy';

const r0 = () => 0;

describe('flappy', () => {
  it('初期状態は中央・未over', () => {
    const s = createFlappy(r0);
    expect(s.over).toBe(false);
    expect(s.score).toBe(0);
    expect(s.by).toBeCloseTo(FLAPPY.h / 2);
  });

  it('重力で落ちる、フラップで上がる', () => {
    let s = createFlappy(r0);
    s = { ...s, spawnTimer: 9999, pipes: [] };
    const fall = stepFlappy(s, false, r0);
    expect(fall.by).toBeGreaterThan(s.by); // 下に落ちた
    const flap = stepFlappy(s, true, r0);
    expect(flap.by).toBeLessThan(s.by); // 上がった
  });

  it('床に落ちると over', () => {
    let s = createFlappy(r0);
    s = { ...s, by: FLAPPY.h - 1, vy: -5, spawnTimer: 9999, pipes: [] };
    expect(stepFlappy(s, false, r0).over).toBe(true);
  });

  it('天井に当たると over', () => {
    let s = createFlappy(r0);
    s = { ...s, by: 1, vy: 5, spawnTimer: 9999, pipes: [] };
    expect(stepFlappy(s, true, r0).over).toBe(true);
  });

  it('すき間をくぐると scored・score+1', () => {
    let s = createFlappy(r0);
    // 鳥のすぐ左にパイプ（次tickで birdX を通過）、鳥はすき間内
    s = {
      ...s,
      by: 60,
      vy: 0,
      spawnTimer: 9999,
      pipes: [{ x: FLAPPY.birdX - FLAPPY.pipeW, gapY: 30, scored: false }],
    };
    const n = stepFlappy(s, false, r0);
    expect(n.score).toBe(1);
  });

  it('パイプにぶつかると over', () => {
    let s = createFlappy(r0);
    // 鳥の位置にパイプ、鳥はすき間の外（上）
    s = {
      ...s,
      by: 10,
      vy: 0,
      spawnTimer: 9999,
      pipes: [{ x: FLAPPY.birdX - 5, gapY: 120, scored: false }],
    };
    expect(stepFlappy(s, false, r0).over).toBe(true);
  });

  it('すき間内ならパイプに重なっても over しない', () => {
    let s = createFlappy(r0);
    s = {
      ...s,
      by: 130,
      vy: 0,
      spawnTimer: 9999,
      pipes: [{ x: FLAPPY.birdX - 5, gapY: 110, scored: false }],
    };
    expect(stepFlappy(s, false, r0).over).toBe(false);
  });
});
