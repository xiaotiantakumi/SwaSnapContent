// 神経衰弱（メモリーめくり）の純粋ロジック（React非依存・テスト対象）。
// 1ボードそろえるたびに もっとカードが増えて難しくなる（レベルアップ）。
// 終わりは「やめる」で、それまでにそろえたボード数がスコア。

export const MEMORY = {
  basePairs: 5, // レベル1のペア数
  maxPairs: 8, // 上限（4x4=16枚）
} as const;

export function memoryPairs(level: number): number {
  return Math.min(MEMORY.maxPairs, MEMORY.basePairs + level - 1);
}

export type Card = { value: number; revealed: boolean; matched: boolean };

export type MemoryState = {
  cards: Card[];
  boardPairs: number; // このボードのペア数
  firstIdx: number | null;
  moves: number;
  pairs: number; // このボードでそろえたペア
  busy: boolean; // 不一致を見せている最中
  cleared: boolean; // このボードを全部そろえた（描画側が次レベルへ）
};

/** Fisher-Yates（rand[0,1)）でシャッフルしたボードを作る。 */
export function createMemory(rand: () => number, level = 1): MemoryState {
  const boardPairs = memoryPairs(level);
  const values: number[] = [];
  for (let v = 0; v < boardPairs; v++) {
    values.push(v, v);
  }
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return {
    cards: values.map((value) => ({ value, revealed: false, matched: false })),
    boardPairs,
    firstIdx: null,
    moves: 0,
    pairs: 0,
    busy: false,
    cleared: false,
  };
}

/** カードをめくる。busy 中・既出・取得済み・cleared は無視。 */
export function pickCard(s: MemoryState, i: number): MemoryState {
  if (s.cleared || s.busy) return s;
  const card = s.cards[i];
  if (!card || card.revealed || card.matched) return s;

  const cards = s.cards.map((c, idx) =>
    idx === i ? { ...c, revealed: true } : c
  );

  if (s.firstIdx === null) {
    return { ...s, cards, firstIdx: i };
  }

  const moves = s.moves + 1;
  const first = cards[s.firstIdx];
  if (first.value === card.value) {
    const matched = cards.map((c, idx) =>
      idx === i || idx === s.firstIdx ? { ...c, matched: true } : c
    );
    const pairs = s.pairs + 1;
    return {
      ...s,
      cards: matched,
      firstIdx: null,
      moves,
      pairs,
      cleared: pairs >= s.boardPairs,
    };
  }
  return { ...s, cards, firstIdx: i, moves, busy: true };
}

/** 不一致の2枚を裏に戻す（busy のときに描画側が呼ぶ）。 */
export function resolveMemory(s: MemoryState): MemoryState {
  if (!s.busy) return s;
  const cards = s.cards.map((c) =>
    c.matched ? c : { ...c, revealed: false }
  );
  return { ...s, cards, firstIdx: null, busy: false };
}
