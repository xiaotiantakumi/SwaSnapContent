// ショップの価格/スロット表（サーバー版・購入検証の正）。
// クライアント app/sansu-100/lib/shop-catalog.ts とアイテムID・価格・スロットを一致させること。
// 描画情報(render)はサーバーでは不要なので持たない。アイテム追加時は両ファイルを更新する。

import type { ItemSlot } from './sansuTypes';

export type ShopPriceEntry = { price: number; slot: ItemSlot };

export const SHOP_PRICES: Record<string, ShopPriceEntry> = {
  // 帽子/メガネ等は avatarShop.ts（avatarConfig で着替え）。ここは背景/枠/動きのみ。
  // background
  bg_sky: { price: 50, slot: 'background' },
  bg_sea: { price: 50, slot: 'background' },
  bg_space: { price: 200, slot: 'background' },
  bg_sunset: { price: 200, slot: 'background' },
  bg_rainbow: { price: 1000, slot: 'background' },
  // frame
  frame_dots: { price: 50, slot: 'frame' },
  frame_gold: { price: 200, slot: 'frame' },
  frame_fire: { price: 200, slot: 'frame' },
  frame_rainbow: { price: 1000, slot: 'frame' },
  // effect
  effect_bounce: { price: 50, slot: 'effect' },
  effect_pulse: { price: 200, slot: 'effect' },
  effect_spin: { price: 1000, slot: 'effect' },
};

export function getShopPrice(id: string): ShopPriceEntry | undefined {
  return SHOP_PRICES[id];
}
