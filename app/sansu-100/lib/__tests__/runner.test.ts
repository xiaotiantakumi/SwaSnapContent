import { describe, it, expect } from 'vitest';
import { createRunner, stepRunner, RUNNER } from '../games/runner';

const r0 = () => 0;

describe('runner', () => {
  it('初期状態は接地・距離0・未over', () => {
    const s = createRunner(r0);
    expect(s.onGround).toBe(true);
    expect(s.py).toBe(0);
    expect(s.distance).toBe(0);
    expect(s.over).toBe(false);
  });

  it('ジャンプで上昇し、やがて接地する', () => {
    let s = createRunner(r0);
    s = { ...s, obstacles: [] };
    const jumped = stepRunner(s, true, r0);
    expect(jumped.py).toBeGreaterThan(0);
    expect(jumped.onGround).toBe(false);
    // 何ステップか進めると着地する（障害物なし）
    let cur = jumped;
    for (let i = 0; i < 40; i++) cur = stepRunner(cur, false, r0);
    expect(cur.onGround).toBe(true);
    expect(cur.py).toBe(0);
  });

  it('空中ではもう一度ジャンプできない（二段ジャンプ不可）', () => {
    let s = createRunner(r0);
    s = stepRunner(s, true, r0); // ジャンプ
    const vyAir = s.vy;
    const again = stepRunner(s, true, r0); // 空中で再ジャンプ要求
    // 速度は重力で減るだけ（ジャンプ初速にリセットされない）
    expect(again.vy).toBeLessThan(vyAir);
  });

  it('距離はスコアとして増える', () => {
    let s = createRunner(r0);
    s = { ...s, obstacles: [], spawnTimer: 9999 };
    const n = stepRunner(s, false, r0);
    expect(n.distance).toBeGreaterThan(0);
  });

  it('地上の障害物に当たると over', () => {
    let s = createRunner(r0);
    // プレイヤーの目の前に背の高い障害物を置く（接地中）
    s = {
      ...s,
      py: 0,
      onGround: true,
      spawnTimer: 9999,
      obstacles: [{ x: RUNNER.playerX, w: 20, h: 25 }],
    };
    const n = stepRunner(s, false, r0);
    expect(n.over).toBe(true);
  });

  it('ジャンプで障害物を飛び越えれば over しない', () => {
    let s = createRunner(r0);
    // 高く飛んでいる状態（py が障害物より上）で障害物が重なっても当たらない
    s = {
      ...s,
      py: 40,
      vy: 0,
      onGround: false,
      spawnTimer: 9999,
      obstacles: [{ x: RUNNER.playerX, w: 20, h: 25 }],
    };
    const n = stepRunner(s, false, r0);
    expect(n.over).toBe(false);
  });

  it('時間とともに speed が上がる（上限あり）', () => {
    const s = createRunner(r0);
    const slow = stepRunner({ ...s, distance: 0 }, false, r0).speed;
    const fast = stepRunner({ ...s, distance: 5000 }, false, r0).speed;
    expect(fast).toBeGreaterThan(slow);
    expect(fast).toBeLessThanOrEqual(RUNNER.maxSpeed);
  });
});
