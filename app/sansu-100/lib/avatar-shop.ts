import { DEFAULT_AVATAR_CONFIG } from './avatar-options';
import type { AvatarConfig } from './types';

// 有料のアバター・アクセサリー（DiceBear avataaars 内蔵パーツ）。
// 買うと ownedItems に id が入り、ビルダーで装備（avatarConfig に反映）できる。
// サーバー avatarShop.ts と id・価格・カテゴリを一致させること。

export type AvatarItemCategory = 'hat' | 'glasses' | 'clothing' | 'beard';

// カテゴリ → avatarConfig のどのフィールドに入るか
export const AVATAR_ITEM_FIELD: Record<AvatarItemCategory, keyof AvatarConfig> = {
  hat: 'top',
  glasses: 'accessory',
  clothing: 'clothing',
  beard: 'facialHair',
};

export const AVATAR_CATEGORY_LABEL: Record<AvatarItemCategory, string> = {
  hat: 'ぼうし',
  glasses: 'メガネ',
  clothing: 'ふく',
  beard: 'ひげ',
};

export const AVATAR_CATEGORY_ICON: Record<AvatarItemCategory, string> = {
  hat: '🎩',
  glasses: '👓',
  clothing: '👕',
  beard: '🧔',
};

export type ItemRarity = 'normal' | 'rare' | 'epic';
export const ITEM_PRICES: Record<ItemRarity, number> = {
  normal: 50,
  rare: 200,
  epic: 1000,
};

export type AvatarItemDef = {
  id: string;
  category: AvatarItemCategory;
  value: string; // DiceBear のオプション値
  name: string;
  rarity: ItemRarity;
  price: number;
};

type Seed = [AvatarItemCategory, string, string, ItemRarity];

const SEEDS: Seed[] = [
  // ---- ぼうし（top に入る） ----
  ['hat', 'hat', 'シルクハット', 'rare'],
  ['hat', 'turban', 'ターバン', 'rare'],
  ['hat', 'hijab', 'ヒジャブ', 'normal'],
  ['hat', 'winterHat1', 'ニットぼうし', 'normal'],
  ['hat', 'winterHat02', 'けいとのぼうし', 'normal'],
  ['hat', 'winterHat03', 'もこもこぼうし', 'rare'],
  ['hat', 'winterHat04', 'ふゆぼうし', 'rare'],
  // ---- メガネ（accessory に入る） ----
  ['glasses', 'prescription01', 'メガネ', 'normal'],
  ['glasses', 'prescription02', 'しかくメガネ', 'normal'],
  ['glasses', 'kurt', 'まるメガネ', 'normal'],
  ['glasses', 'round', 'まんまるメガネ', 'rare'],
  ['glasses', 'wayfarers', 'クールメガネ', 'rare'],
  ['glasses', 'sunglasses', 'サングラス', 'rare'],
  ['glasses', 'eyepatch', 'かいぞくパッチ', 'epic'],
  // ---- ふく（clothing に入る。shirtCrewNeck は無料の初期服） ----
  ['clothing', 'hoodie', 'パーカー', 'normal'],
  ['clothing', 'graphicShirt', 'プリントT', 'normal'],
  ['clothing', 'shirtScoopNeck', 'まるえりT', 'normal'],
  ['clothing', 'shirtVNeck', 'ブイえりT', 'normal'],
  ['clothing', 'collarAndSweater', 'えりつきニット', 'rare'],
  ['clothing', 'blazerAndShirt', 'ジャケット', 'rare'],
  ['clothing', 'blazerAndSweater', 'ニットジャケット', 'rare'],
  ['clothing', 'overall', 'オーバーオール', 'epic'],
  // ---- ひげ（facialHair に入る） ----
  ['beard', 'beardLight', 'うすひげ', 'normal'],
  ['beard', 'beardMedium', 'あごひげ', 'rare'],
  ['beard', 'moustacheFancy', 'おしゃれひげ', 'rare'],
  ['beard', 'moustacheMagnum', 'カイゼルひげ', 'epic'],
  ['beard', 'beardMajestic', 'りっぱなひげ', 'epic'],
];

export const AVATAR_SHOP: AvatarItemDef[] = SEEDS.map(
  ([category, value, name, rarity]) => ({
    id: `av_${category}_${value}`,
    category,
    value,
    name,
    rarity,
    price: ITEM_PRICES[rarity],
  })
);

export const AVATAR_SHOP_BY_ID: Record<string, AvatarItemDef> = Object.fromEntries(
  AVATAR_SHOP.map((it) => [it.id, it])
);

export function getAvatarItem(id: string): AvatarItemDef | undefined {
  return AVATAR_SHOP_BY_ID[id];
}

// あるカテゴリで「所持している値」一覧（ビルダーで選べるもの）。
export function ownedValuesOf(
  category: AvatarItemCategory,
  ownedIds: string[]
): string[] {
  const owned = new Set(ownedIds);
  return AVATAR_SHOP.filter(
    (it) => it.category === category && owned.has(it.id)
  ).map((it) => it.value);
}

// 1パーツだけ載せたプレビュー用の構成（ショップ/ビルダーのサムネ用）。
export function previewConfigWith(
  category: AvatarItemCategory,
  value: string
): AvatarConfig {
  return { ...DEFAULT_AVATAR_CONFIG, [AVATAR_ITEM_FIELD[category]]: value };
}
