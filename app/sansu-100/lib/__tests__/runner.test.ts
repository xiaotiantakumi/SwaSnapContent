import { describe, it, expect } from 'vitest';
import { createRunner, stepRunner, RUNNER } from '../games/runner';

const r0 = () => 0;

describe('runner', () => {
  it('初期状態は接地・距離0・レベル1・未over', () => {
    const s = createRunner(r0);
    expect(s.onGround).toBe(true);
    expect(s.py).toBe(0);
    expect(s.distance).toBe(0);
    expect(s.level).toBe(1);
    expect(s.over).toBe(false);
  });

  it('ジャンプで上昇し、やがて接地する', () => {
    let s = createRunner(r0);
    s = { ...s, obstacles: [], spawnTimer: 9999 };
    const jumped = stepRunner(s, true, r0);
    expect(jumped.py).toBeGreaterThan(0);
    expect(jumped.onGround).toBe(false);
    let cur = jumped;
    for (let i = 0; i < 60; i++) cur = stepRunner(cur, false, r0);
    expect(cur.onGround).toBe(true);
    expect(cur.py).toBe(0);
  });

  it('空中ではもう一度ジャンプできない（二段ジャンプ不可）', () => {
    let s = createRunner(r0);
    s = { ...s, spawnTimer: 9999 };
    s = stepRunner(s, true, r0);
    const vyAir = s.vy;
    const again = stepRunner(s, true, r0);
    expect(again.vy).toBeLessThan(vyAir);
  });

  it('距離はスコアとして増える', () => {
    let s = createRunner(r0);
    s = { ...s, obstacles: [], platforms: [], spawnTimer: 9999 };
    const n = stepRunner(s, false, r0);
    expect(n.distance).toBeGreaterThan(0);
  });

  it('地上の障害物に当たると over', () => {
    let s = createRunner(r0);
    s = {
      ...s,
      py: 0,
      onGround: true,
      spawnTimer: 9999,
      platforms: [],
      obstacles: [{ x: RUNNER.playerX, w: 20, h: 25 }],
    };
    const n = stepRunner(s, false, r0);
    expect(n.over).toBe(true);
  });

  it('高くジャンプ中なら障害物に当たらない', () => {
    let s = createRunner(r0);
    s = {
      ...s,
      py: 40,
      vy: 0,
      onGround: false,
      spawnTimer: 9999,
      platforms: [],
      obstacles: [{ x: RUNNER.playerX, w: 20, h: 25 }],
    };
    const n = stepRunner(s, false, r0);
    expect(n.over).toBe(false);
  });

  it('ふゆう台に乗れる（落下中に台の上で止まる）', () => {
    let s = createRunner(r0);
    s = {
      ...s,
      py: 50,
      vy: -5,
      onGround: false,
      spawnTimer: 9999,
      obstacles: [],
      platforms: [{ x: RUNNER.playerX - 5, w: 70, top: 44 }],
    };
    let cur = s;
    for (let i = 0; i < 8; i++) {
      cur = stepRunner(cur, false, r0);
      if (cur.onGround) break;
    }
    expect(cur.onGround).toBe(true);
    expect(cur.py).toBe(44); // 台の上で止まる
  });

  it('一定距離ごとにレベルアップして速くなる', () => {
    let s = createRunner(r0);
    s = {
      ...s,
      distance: RUNNER.distPerLevel,
      level: 1,
      spawnTimer: 9999,
      obstacles: [],
      platforms: [],
    };
    const n = stepRunner(s, false, r0);
    expect(n.level).toBe(2);
    expect(n.leveledUp).toBe(true);
    const slow = stepRunner({ ...createRunner(r0), distance: 0 }, false, r0).speed;
    expect(n.speed).toBeGreaterThan(slow);
    expect(n.speed).toBeLessThanOrEqual(RUNNER.maxSpeed);
  });
});
