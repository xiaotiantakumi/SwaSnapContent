import { DEFAULT_AVATAR_CONFIG } from './avatar-options';
import type { AvatarConfig } from './types';

// 有料のアバター・アクセサリー（DiceBear avataaars 内蔵パーツ）。
// 買うと ownedItems に id が入り、ビルダーで装備（avatarConfig に反映）できる。
// サーバー avatarShop.ts と id・価格・カテゴリを一致させること。

export type AvatarItemCategory =
  | 'hat'
  | 'glasses'
  | 'clothing'
  | 'beard'
  | 'hairstyle'
  | 'haircolor'
  | 'eyes'
  | 'eyebrow'
  | 'mouthstyle'
  | 'clothescolor';

// カテゴリ → avatarConfig のどのフィールドに入るか
export const AVATAR_ITEM_FIELD: Record<AvatarItemCategory, keyof AvatarConfig> = {
  hat: 'top',
  glasses: 'accessory',
  clothing: 'clothing',
  beard: 'facialHair',
  hairstyle: 'top',
  haircolor: 'hairColor',
  eyes: 'eyes',
  eyebrow: 'eyebrows',
  mouthstyle: 'mouth',
  clothescolor: 'clothesColor',
};

export const AVATAR_CATEGORY_LABEL: Record<AvatarItemCategory, string> = {
  hat: 'ぼうし',
  glasses: 'メガネ',
  clothing: 'ふく',
  beard: 'ひげ',
  hairstyle: 'かみがた',
  haircolor: 'かみのいろ',
  eyes: 'め',
  eyebrow: 'まゆげ',
  mouthstyle: 'くち',
  clothescolor: 'ふくのいろ',
};

export const AVATAR_CATEGORY_ICON: Record<AvatarItemCategory, string> = {
  hat: '🎩',
  glasses: '👓',
  clothing: '👕',
  beard: '🧔',
  hairstyle: '💇',
  haircolor: '🎨',
  eyes: '👀',
  eyebrow: '🤨',
  mouthstyle: '👄',
  clothescolor: '🌈',
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
  // ---- かみがた（新カテゴリ。top に入る） ----
  ['hairstyle', 'curvy', 'ながいウェーブ', 'rare'],
  ['hairstyle', 'miaWallace', 'ぱっつんボブ', 'rare'],
  ['hairstyle', 'frida', 'みつあみ', 'rare'],
  ['hairstyle', 'froBand', 'もりもりヘアバンド', 'rare'],
  ['hairstyle', 'straight02', 'ストレートロング', 'normal'],
  ['hairstyle', 'straightAndStrand', 'さらさらまえがみ', 'normal'],
  ['hairstyle', 'dreads02', 'ドレッズロング', 'rare'],
  ['hairstyle', 'frizzle', 'ふわふわヘア', 'normal'],
  ['hairstyle', 'shaggy', 'ふんわりレイヤー', 'normal'],
  ['hairstyle', 'shaggyMullet', 'ウルフカット', 'rare'],
  ['hairstyle', 'shavedSides', 'サイドがり', 'rare'],
  ['hairstyle', 'theCaesarAndSidePart', '７３わけ', 'normal'],
  // ---- かみのいろ（新カテゴリ。hairColor に入る） ----
  ['haircolor', 'f59797', 'さくらピンク', 'normal'],
  ['haircolor', 'ecdcbf', 'ミルクベージュ', 'normal'],
  ['haircolor', 'd6b370', 'はちみつ', 'normal'],
  ['haircolor', 'c7a2ff', 'ラベンダー', 'rare'],
  ['haircolor', 'a7ffc4', 'ミントグリーン', 'rare'],
  ['haircolor', 'b1e2ff', 'そらいろ', 'rare'],
  ['haircolor', 'ffd6f5', 'ゆめかわピンク', 'rare'],
  ['haircolor', 'c0c0c0', 'シルバー', 'epic'],
  // ---- め（既存カテゴリに追加。eyes に入る） ----
  ['eyes', 'cry', 'なきむし', 'normal'],
  ['eyes', 'eyeRoll', 'くるりんめ', 'normal'],
  ['eyes', 'winkWacky', 'おちゃめウィンク', 'rare'],
  ['eyes', 'xDizzy', 'ぐるぐるめ', 'rare'],
  // ---- まゆげ（新カテゴリ。eyebrows に入る） ----
  ['eyebrow', 'angryNatural', 'りりしいまゆ', 'normal'],
  ['eyebrow', 'frownNatural', 'むっとまゆ', 'normal'],
  ['eyebrow', 'raisedExcitedNatural', 'わくわくまゆ', 'normal'],
  ['eyebrow', 'sadConcernedNatural', 'しょんぼりまゆ', 'normal'],
  ['eyebrow', 'unibrowNatural', 'つながりまゆ', 'rare'],
  ['eyebrow', 'upDownNatural', 'ちぐはぐまゆ', 'rare'],
  ['eyebrow', 'upDown', 'びっくりまゆ', 'normal'],
  // ---- くち（新カテゴリ。mouth に入る） ----
  ['mouthstyle', 'concerned', 'こまりがお', 'normal'],
  ['mouthstyle', 'grimace', 'にやり', 'rare'],
  ['mouthstyle', 'sad', 'しょんぼり', 'normal'],
  ['mouthstyle', 'vomit', 'げろげろ', 'rare'],
  // ---- ふくのいろ（新カテゴリ。clothesColor に入る） ----
  ['clothescolor', 'ff488e', 'ホットピンク', 'normal'],
  ['clothescolor', 'a7ffc4', 'ミント', 'normal'],
  ['clothescolor', 'b1e2ff', 'パステルブルー', 'normal'],
  ['clothescolor', 'ffffb1', 'レモンイエロー', 'normal'],
  ['clothescolor', 'ffafb9', 'コーラルピンク', 'normal'],
  ['clothescolor', '25557c', 'ネイビー', 'rare'],
  ['clothescolor', 'ffffff', 'しろ', 'rare'],
  ['clothescolor', '262e33', 'くろ', 'rare'],
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

// あるカテゴリ（複数可。例: top タブは hat と hairstyle 両方）で
// 「所持している値」一覧（ビルダーで選べるもの）。
export function ownedValuesOf(
  category: AvatarItemCategory | AvatarItemCategory[],
  ownedIds: string[]
): string[] {
  const owned = new Set(ownedIds);
  const categories = new Set(
    Array.isArray(category) ? category : [category]
  );
  return AVATAR_SHOP.filter(
    (it) => categories.has(it.category) && owned.has(it.id)
  ).map((it) => it.value);
}

// 1パーツだけ載せたプレビュー用の構成（ショップ/ビルダーのサムネ用）。
export function previewConfigWith(
  category: AvatarItemCategory,
  value: string
): AvatarConfig {
  return { ...DEFAULT_AVATAR_CONFIG, [AVATAR_ITEM_FIELD[category]]: value };
}
