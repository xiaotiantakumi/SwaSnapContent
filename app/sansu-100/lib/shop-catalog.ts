// アバターショップのアイテム定義（クライアント）。
// 価格はサーバー api/src/shared/shopCatalog.ts と一致させること（購入時の価格はサーバーが正）。
// ガチャは無し＝すべてコインでの「指名買い」。レアリティ＝価格で表現する。
//
// Tailwind のクラス名は app/** を content スキャンするため、ここに「完全な文字列」で書けば
// パージされない。動的連結（`bg-${x}`）は不可。

import type { ItemSlot } from './types';

export type ItemRarity = 'normal' | 'rare' | 'epic';

export const ITEM_PRICES: Record<ItemRarity, number> = {
  normal: 50,
  rare: 200,
  epic: 1000,
};

// アバターへの重ね方。AvatarDisplay が解釈する。
export type ItemRender =
  // 頭の上などに絵文字を重ねる（帽子・アクセサリー）
  | { kind: 'emojiOverlay'; emoji: string; position: 'top' | 'topRight' }
  // 背景クラス（コンテナ背景）
  | { kind: 'bgClass'; className: string }
  // フレーム（リング/ボーダー）クラス
  | { kind: 'frameClass'; className: string }
  // エフェクト（アバターに付与するアニメ等）クラス
  | { kind: 'effectClass'; className: string };

export type ShopItemDef = {
  id: string;
  slot: ItemSlot;
  name: string; // 子ども向け表示名（ふりがな相当のやさしい語）
  icon: string; // ショップ一覧のサムネ用絵文字
  rarity: ItemRarity;
  price: number;
  render: ItemRender;
};

function priceOf(rarity: ItemRarity): number {
  return ITEM_PRICES[rarity];
}

function item(
  id: string,
  slot: ItemSlot,
  name: string,
  icon: string,
  rarity: ItemRarity,
  render: ItemRender
): ShopItemDef {
  return { id, slot, name, icon, rarity, price: priceOf(rarity), render };
}

export const SHOP_CATALOG: readonly ShopItemDef[] = [
  // ---- 帽子・アクセサリー（hat） ----
  item('hat_cap', 'hat', 'キャップ', '🧢', 'normal', {
    kind: 'emojiOverlay',
    emoji: '🧢',
    position: 'top',
  }),
  item('hat_ribbon', 'hat', 'リボン', '🎀', 'normal', {
    kind: 'emojiOverlay',
    emoji: '🎀',
    position: 'topRight',
  }),
  item('hat_crown', 'hat', 'おうかん', '👑', 'rare', {
    kind: 'emojiOverlay',
    emoji: '👑',
    position: 'top',
  }),
  item('hat_tophat', 'hat', 'シルクハット', '🎩', 'rare', {
    kind: 'emojiOverlay',
    emoji: '🎩',
    position: 'top',
  }),
  item('hat_wizard', 'hat', 'まほうのぼうし', '🪄', 'epic', {
    kind: 'emojiOverlay',
    emoji: '🎓',
    position: 'top',
  }),

  // ---- 背景（background） ----
  item('bg_sky', 'background', 'そら', '🌤️', 'normal', {
    kind: 'bgClass',
    className: 'bg-gradient-to-br from-sky-300 to-blue-400',
  }),
  item('bg_sea', 'background', 'うみのなか', '🐠', 'normal', {
    kind: 'bgClass',
    className: 'bg-gradient-to-br from-cyan-400 to-blue-600',
  }),
  item('bg_space', 'background', 'うちゅう', '🌌', 'rare', {
    kind: 'bgClass',
    className: 'bg-gradient-to-br from-indigo-700 to-purple-900',
  }),
  item('bg_sunset', 'background', 'ゆうやけ', '🌅', 'rare', {
    kind: 'bgClass',
    className: 'bg-gradient-to-br from-orange-400 to-pink-600',
  }),
  item('bg_rainbow', 'background', 'にじいろ', '🌈', 'epic', {
    kind: 'bgClass',
    className:
      'bg-gradient-to-br from-pink-400 via-yellow-300 to-emerald-400',
  }),

  // ---- フレーム（frame） ----
  item('frame_dots', 'frame', 'みずたま', '⚪', 'normal', {
    kind: 'frameClass',
    className: 'ring-4 ring-sky-300',
  }),
  item('frame_gold', 'frame', 'きんのわく', '🟡', 'rare', {
    kind: 'frameClass',
    className: 'ring-4 ring-yellow-400',
  }),
  item('frame_fire', 'frame', 'ほのお', '🔥', 'rare', {
    kind: 'frameClass',
    className: 'ring-4 ring-orange-500',
  }),
  item('frame_rainbow', 'frame', 'にじのわく', '🌈', 'epic', {
    kind: 'frameClass',
    className: 'ring-4 ring-pink-400',
  }),

  // ---- エフェクト（effect） ----
  item('effect_bounce', 'effect', 'ぴょんぴょん', '⤴️', 'normal', {
    kind: 'effectClass',
    className: 'animate-bounce',
  }),
  item('effect_pulse', 'effect', 'きらきら', '✨', 'rare', {
    kind: 'effectClass',
    className: 'animate-pulse',
  }),
  item('effect_spin', 'effect', 'くるくる', '💫', 'epic', {
    kind: 'effectClass',
    className: 'animate-spin',
  }),
];

export const SHOP_BY_ID: Record<string, ShopItemDef> = Object.fromEntries(
  SHOP_CATALOG.map((it) => [it.id, it])
);

export function getItemDef(id: string): ShopItemDef | undefined {
  return SHOP_BY_ID[id];
}

export const RARITY_LABEL: Record<ItemRarity, string> = {
  normal: 'ノーマル',
  rare: 'レア',
  epic: 'エピック',
};
