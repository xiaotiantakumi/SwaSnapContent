import { describe, it, expect } from 'vitest';
import {
  createMemory,
  pickCard,
  resolveMemory,
  MEMORY,
} from '../games/memory';

const r0 = () => 0;

describe('memory', () => {
  it('デッキは 2*pairs 枚・各値が2枚ずつ', () => {
    const s = createMemory(r0);
    expect(s.cards).toHaveLength(MEMORY.pairs * 2);
    const counts = new Map<number, number>();
    for (const c of s.cards) counts.set(c.value, (counts.get(c.value) ?? 0) + 1);
    for (const v of counts.values()) expect(v).toBe(2);
    expect(s.cards.every((c) => !c.revealed && !c.matched)).toBe(true);
  });

  it('1枚目をめくると revealed・firstIdx 設定', () => {
    const s = createMemory(r0);
    const n = pickCard(s, 0);
    expect(n.cards[0].revealed).toBe(true);
    expect(n.firstIdx).toBe(0);
  });

  it('同じ値の2枚で一致＝matched・ペア+1', () => {
    const s = createMemory(r0);
    // value=0 の2枚を探す
    const idxs = s.cards
      .map((c, i) => (c.value === s.cards[0].value ? i : -1))
      .filter((i) => i >= 0);
    let n = pickCard(s, idxs[0]);
    n = pickCard(n, idxs[1]);
    expect(n.pairs).toBe(1);
    expect(n.cards[idxs[0]].matched).toBe(true);
    expect(n.cards[idxs[1]].matched).toBe(true);
    expect(n.busy).toBe(false);
  });

  it('違う値の2枚で busy・resolve で裏に戻る', () => {
    const s = createMemory(r0);
    const a = 0;
    const b = s.cards.findIndex((c, i) => i !== a && c.value !== s.cards[a].value);
    let n = pickCard(s, a);
    n = pickCard(n, b);
    expect(n.busy).toBe(true);
    expect(n.cards[a].revealed && n.cards[b].revealed).toBe(true);
    const r = resolveMemory(n);
    expect(r.busy).toBe(false);
    expect(r.cards[a].revealed || r.cards[b].revealed).toBe(false);
  });

  it('busy 中のめくりは無視', () => {
    const s = createMemory(r0);
    const a = 0;
    const b = s.cards.findIndex((c, i) => i !== a && c.value !== s.cards[a].value);
    let n = pickCard(pickCard(s, a), b); // busy
    const other = s.cards.findIndex(
      (c, i) => i !== a && i !== b && !c.matched
    );
    expect(pickCard(n, other)).toBe(n); // 変化なし
  });

  it('全ペアそろうと over', () => {
    let s = createMemory(r0);
    // 全ペアを順にそろえる
    for (let v = 0; v < MEMORY.pairs; v++) {
      const idxs = s.cards
        .map((c, i) => (c.value === v ? i : -1))
        .filter((i) => i >= 0);
      s = pickCard(s, idxs[0]);
      s = pickCard(s, idxs[1]);
    }
    expect(s.pairs).toBe(MEMORY.pairs);
    expect(s.over).toBe(true);
  });
});
