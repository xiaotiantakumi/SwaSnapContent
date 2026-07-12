// カート状態の純粋関数群（PR3）。
// カート本体は itemId の Set<string> として画面側(useState)で保持し、ここでは
// 合計金額の計算・コイン内で買える範囲の判定のみを担当する。
// 実際の一括購入（all-or-nothing）はPR4のバッチ購入APIで行う。

export type CartLine = { id: string; name: string; price: number; owned: boolean };

/** カートに入っているアイテムの合計金額を返す。 */
export function cartTotal(
  cart: Set<string>,
  priceOf: (id: string) => number
): number {
  let total = 0;
  for (const id of cart) {
    total += priceOf(id);
  }
  return total;
}

/**
 * 手持ちコインの範囲内でカートの中身を先頭から順に買えるだけ買った場合の
 * 「買えるアイテムidの一覧」と「その合計金額」を返す。
 * 現時点のUI（C3-B）では未使用だが、将来的な部分購入UI向けに設計書§4-1の
 * シグネチャ通り用意しておく。
 */
export function affordableWithin(
  cart: Set<string>,
  coins: number,
  priceOf: (id: string) => number
): { buyable: string[]; total: number } {
  const buyable: string[] = [];
  let total = 0;
  for (const id of cart) {
    const price = priceOf(id);
    if (total + price <= coins) {
      buyable.push(id);
      total += price;
    }
  }
  return { buyable, total };
}
