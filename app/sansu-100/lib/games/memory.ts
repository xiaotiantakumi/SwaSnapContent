// 神経衰弱（メモリーめくり）の純粋ロジック（React非依存・テスト対象）。
// カードを2枚めくって同じ絵柄なら取得。全ペア取得でクリア。アクション要素なし。

export const MEMORY = {
  pairs: 6, // 6ペア=12枚（3x4）
} as const;

export type Card = { value: number; revealed: boolean; matched: boolean };

export type MemoryState = {
  cards: Card[];
  firstIdx: number | null; // 1枚目をめくった位置
  moves: number; // めくった回数（2枚で1）
  pairs: number; // そろったペア数
  busy: boolean; // 不一致を見せている最中（resolve 待ち）
  over: boolean; // 全部そろった
};

/** Fisher-Yates（rand[0,1)）でシャッフルしたデッキを作る。 */
export function createMemory(rand: () => number): MemoryState {
  const values: number[] = [];
  for (let v = 0; v < MEMORY.pairs; v++) {
    values.push(v, v);
  }
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return {
    cards: values.map((value) => ({ value, revealed: false, matched: false })),
    firstIdx: null,
    moves: 0,
    pairs: 0,
    busy: false,
    over: false,
  };
}

/** カードをめくる。busy 中・既出・取得済み・over は無視。 */
export function pickCard(s: MemoryState, i: number): MemoryState {
  if (s.over || s.busy) return s;
  const card = s.cards[i];
  if (!card || card.revealed || card.matched) return s;

  const cards = s.cards.map((c, idx) =>
    idx === i ? { ...c, revealed: true } : c
  );

  if (s.firstIdx === null) {
    return { ...s, cards, firstIdx: i };
  }

  // 2枚目
  const moves = s.moves + 1;
  const first = cards[s.firstIdx];
  if (first.value === card.value) {
    // 一致：取得
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
      over: pairs >= MEMORY.pairs,
    };
  }
  // 不一致：両方見せたまま busy（描画側が少し待って resolveMemory を呼ぶ）
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
