import { describe, it, expect } from 'vitest';
import { createFalling, stepFalling, FALLING } from '../games/falling';

const r0 = () => 0;

describe('falling', () => {
  it('初期状態は中央・アイテムなし・未over', () => {
    const s = createFalling(r0);
    expect(s.items).toEqual([]);
    expect(s.over).toBe(false);
    expect(s.score).toBe(0);
  });

  it('spawnTimer が来るとアイテムが出る', () => {
    let s = createFalling(r0);
    s = { ...s, spawnTimer: 1, items: [] };
    const n = stepFalling(s, s.playerX, r0);
    expect(n.items.length).toBe(1);
  });

  it('アイテムは下に落ちる', () => {
    let s = createFalling(r0);
    s = { ...s, spawnTimer: 9999, items: [{ x: 100, y: 10 }] };
    const n = stepFalling(s, s.playerX, r0);
    expect(n.items[0].y).toBeGreaterThan(10);
  });

  it('生存スコアが増える', () => {
    let s = createFalling(r0);
    s = { ...s, spawnTimer: 9999 };
    expect(stepFalling(s, s.playerX, r0).score).toBe(1);
  });

  it('アイテムがプレイヤーに当たると over', () => {
    let s = createFalling(r0);
    const px = 80;
    s = {
      ...s,
      playerX: px,
      spawnTimer: 9999,
      items: [{ x: px + FALLING.playerW / 2, y: FALLING.playerY }],
    };
    const n = stepFalling(s, px, r0);
    expect(n.over).toBe(true);
  });

  it('離れたアイテムでは over しない', () => {
    let s = createFalling(r0);
    s = {
      ...s,
      playerX: 0,
      spawnTimer: 9999,
      items: [{ x: FALLING.w, y: 10 }],
    };
    expect(stepFalling(s, 0, r0).over).toBe(false);
  });

  it('プレイヤーは画面外に出ない', () => {
    const s = createFalling(r0);
    expect(stepFalling(s, -999, r0).playerX).toBe(0);
    expect(stepFalling(s, 99999, r0).playerX).toBe(FALLING.w - FALLING.playerW);
  });
});
