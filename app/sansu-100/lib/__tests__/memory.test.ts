import { describe, it, expect } from 'vitest';
import {
  createMemory,
  pickCard,
  resolveMemory,
  memoryPairs,
  memoryTimeLimit,
  MEMORY,
} from '../games/memory';

const r0 = () => 0;

describe('memory', () => {
  it('レベル1は basePairs ペア・各値2枚ずつ', () => {
    const s = createMemory(r0, 1);
    expect(s.boardPairs).toBe(MEMORY.basePairs);
    expect(s.cards).toHaveLength(MEMORY.basePairs * 2);
    const counts = new Map<number, number>();
    for (const c of s.cards) counts.set(c.value, (counts.get(c.value) ?? 0) + 1);
    for (const v of counts.values()) expect(v).toBe(2);
    expect(s.cards.every((c) => !c.revealed && !c.matched)).toBe(true);
  });

  it('レベルが上がるとペアが増える（上限あり）', () => {
    expect(memoryPairs(1)).toBe(MEMORY.basePairs);
    expect(memoryPairs(2)).toBe(MEMORY.basePairs + 1);
    expect(memoryPairs(99)).toBe(MEMORY.maxPairs);
  });

  it('制限時間はレベル別、範囲外は最後の値', () => {
    expect(memoryTimeLimit(1)).toBe(MEMORY.timeLimitSec[0]);
    expect(memoryTimeLimit(2)).toBe(MEMORY.timeLimitSec[1]);
    expect(memoryTimeLimit(99)).toBe(
      MEMORY.timeLimitSec[MEMORY.timeLimitSec.length - 1]
    );
  });

  it('1枚目をめくると revealed・firstIdx 設定', () => {
    const s = createMemory(r0, 1);
    const n = pickCard(s, 0);
    expect(n.cards[0].revealed).toBe(true);
    expect(n.firstIdx).toBe(0);
  });

  it('同じ値の2枚で一致＝matched・ペア+1', () => {
    const s = createMemory(r0, 1);
    const idxs = s.cards
      .map((c, i) => (c.value === s.cards[0].value ? i : -1))
      .filter((i) => i >= 0);
    let n = pickCard(s, idxs[0]);
    n = pickCard(n, idxs[1]);
    expect(n.pairs).toBe(1);
    expect(n.cards[idxs[0]].matched).toBe(true);
    expect(n.busy).toBe(false);
  });

  it('違う値の2枚で busy・resolve で裏に戻る', () => {
    const s = createMemory(r0, 1);
    const a = 0;
    const b = s.cards.findIndex((c, i) => i !== a && c.value !== s.cards[a].value);
    let n = pickCard(s, a);
    n = pickCard(n, b);
    expect(n.busy).toBe(true);
    const r = resolveMemory(n);
    expect(r.busy).toBe(false);
    expect(r.cards[a].revealed || r.cards[b].revealed).toBe(false);
  });

  it('全ペアそろうと cleared（over ではなく次レベルへ）', () => {
    let s = createMemory(r0, 1);
    for (let v = 0; v < s.boardPairs; v++) {
      const idxs = s.cards
        .map((c, i) => (c.value === v ? i : -1))
        .filter((i) => i >= 0);
      s = pickCard(s, idxs[0]);
      s = pickCard(s, idxs[1]);
    }
    expect(s.pairs).toBe(s.boardPairs);
    expect(s.cleared).toBe(true);
  });
});
