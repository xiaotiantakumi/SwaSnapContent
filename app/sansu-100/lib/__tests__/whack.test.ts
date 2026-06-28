import { describe, it, expect } from 'vitest';
import { createWhack, stepWhack, hitHole, WHACK } from '../games/whack';

describe('whack', () => {
  it('初期状態は全穴むこう・スコア0・未over', () => {
    const s = createWhack();
    expect(s.holes).toHaveLength(WHACK.holes);
    expect(s.holes.every((m) => !m.active)).toBe(true);
    expect(s.score).toBe(0);
    expect(s.over).toBe(false);
  });

  it('rand 低めだとモグラが出る', () => {
    const s = createWhack();
    // rand=0 → spawnChance 未満 & badChance 未満 → ふつうのモグラが出る
    const n = stepWhack(s, () => 0);
    expect(n.holes.some((m) => m.active)).toBe(true);
  });

  it('モグラを叩くと +1・引っ込む', () => {
    let s = createWhack();
    s = { ...s };
    s.holes[4] = { active: true, isBad: false, ttl: 5 };
    const n = hitHole(s, 4);
    expect(n.score).toBe(1);
    expect(n.holes[4].active).toBe(false);
  });

  it('ばつを叩くと -1（0未満にならない）', () => {
    let s = createWhack();
    s.holes[0] = { active: true, isBad: true, ttl: 5 };
    const n = hitHole(s, 0);
    expect(n.score).toBe(0);
    s = { ...createWhack(), score: 3 };
    s.holes[0] = { active: true, isBad: true, ttl: 5 };
    expect(hitHole(s, 0).score).toBe(2);
  });

  it('空き穴の空振りはスコア不変', () => {
    const s = createWhack();
    expect(hitHole(s, 0).score).toBe(0);
  });

  it('モグラは ttl 経過で引っ込む', () => {
    let s = createWhack();
    s.holes[2] = { active: true, isBad: false, ttl: 1 };
    const n = stepWhack(s, () => 1); // rand=1 → 新規スポーンなし
    expect(n.holes[2].active).toBe(false);
  });

  it('制限時間が来ると over', () => {
    let s = { ...createWhack(), ticksLeft: 1 };
    const n = stepWhack(s, () => 1);
    expect(n.over).toBe(true);
  });
});
