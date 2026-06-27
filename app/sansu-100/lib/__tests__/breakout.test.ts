import { describe, it, expect } from 'vitest';
import {
  createBreakout,
  stepBreakout,
  BREAKOUT,
} from '../games/breakout';

describe('breakout', () => {
  it('初期状態はブロック全部のこり・未over', () => {
    const s = createBreakout();
    expect(s.bricks).toHaveLength(BREAKOUT.rows * BREAKOUT.cols);
    expect(s.bricks.every(Boolean)).toBe(true);
    expect(s.over).toBe(false);
    expect(s.won).toBe(false);
  });

  it('左の壁で vx が反転する', () => {
    let s = createBreakout();
    s = { ...s, bx: 1, by: 130, vx: -4, vy: 0 };
    const n = stepBreakout(s, s.paddleX);
    expect(n.vx).toBeGreaterThan(0);
  });

  it('ブロックに当たると消えてスコア+1・vy反転', () => {
    let s = createBreakout();
    // 上の方のブロック帯にボールを置き、上向きに当てる
    s = {
      ...s,
      bx: BREAKOUT.w / 2,
      by: BREAKOUT.brickTop + 2,
      vx: 0,
      vy: -3,
    };
    const before = s.bricks.filter(Boolean).length;
    const n = stepBreakout(s, s.paddleX);
    expect(n.score).toBe(1);
    expect(n.bricks.filter(Boolean).length).toBe(before - 1);
    expect(n.vy).toBeGreaterThan(0); // 反転
  });

  it('パドルでボールが跳ね返る（上向きになる）', () => {
    let s = createBreakout();
    const px = s.paddleX;
    s = {
      ...s,
      bx: px + BREAKOUT.paddleW / 2,
      by: BREAKOUT.paddleY - 2,
      vx: 0,
      vy: 3,
    };
    const n = stepBreakout(s, px);
    expect(n.vy).toBeLessThan(0);
  });

  it('ボールが下に落ちると over', () => {
    let s = createBreakout();
    s = { ...s, bx: 100, by: BREAKOUT.h + 20, vx: 0, vy: 3 };
    const n = stepBreakout(s, s.paddleX);
    expect(n.over).toBe(true);
    expect(n.won).toBe(false);
  });

  it('全ブロック消すと won・over', () => {
    let s = createBreakout();
    // 残り1個だけ、その上にボール
    const bricks = s.bricks.map(() => false);
    bricks[0] = true; // row0 col0
    s = {
      ...s,
      bricks,
      bx: BREAKOUT.w / BREAKOUT.cols / 2,
      by: BREAKOUT.brickTop + 2,
      vx: 0,
      vy: -3,
    };
    const n = stepBreakout(s, s.paddleX);
    expect(n.won).toBe(true);
    expect(n.over).toBe(true);
  });

  it('パドルは画面外に出ない', () => {
    const s = createBreakout();
    const n = stepBreakout(s, -999);
    expect(n.paddleX).toBeGreaterThanOrEqual(0);
    const n2 = stepBreakout(s, 99999);
    expect(n2.paddleX).toBeLessThanOrEqual(BREAKOUT.w - BREAKOUT.paddleW);
  });
});
