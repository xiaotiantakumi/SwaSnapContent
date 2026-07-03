// 有料アバター・アクセサリーのサーバー版（購入価格＋所持検証の正）。
// クライアント app/sansu-100/lib/avatar-shop.ts と id・価格・カテゴリ・値を一致させること。

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
export const AVATAR_ITEM_FIELD: Record<AvatarItemCategory, string> = {
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

const PRICE = { normal: 50, rare: 200, epic: 1000 } as const;
type Rarity = keyof typeof PRICE;
type Seed = [AvatarItemCategory, string, Rarity];

const SEEDS: Seed[] = [
  ['hat', 'hat', 'rare'],
  ['hat', 'turban', 'rare'],
  ['hat', 'hijab', 'normal'],
  ['hat', 'winterHat1', 'normal'],
  ['hat', 'winterHat02', 'normal'],
  ['hat', 'winterHat03', 'rare'],
  ['hat', 'winterHat04', 'rare'],
  ['glasses', 'prescription01', 'normal'],
  ['glasses', 'prescription02', 'normal'],
  ['glasses', 'kurt', 'normal'],
  ['glasses', 'round', 'rare'],
  ['glasses', 'wayfarers', 'rare'],
  ['glasses', 'sunglasses', 'rare'],
  ['glasses', 'eyepatch', 'epic'],
  ['clothing', 'hoodie', 'normal'],
  ['clothing', 'graphicShirt', 'normal'],
  ['clothing', 'shirtScoopNeck', 'normal'],
  ['clothing', 'shirtVNeck', 'normal'],
  ['clothing', 'collarAndSweater', 'rare'],
  ['clothing', 'blazerAndShirt', 'rare'],
  ['clothing', 'blazerAndSweater', 'rare'],
  ['clothing', 'overall', 'epic'],
  ['beard', 'beardLight', 'normal'],
  ['beard', 'beardMedium', 'rare'],
  ['beard', 'moustacheFancy', 'rare'],
  ['beard', 'moustacheMagnum', 'epic'],
  ['beard', 'beardMajestic', 'epic'],
  // ---- かみがた（新カテゴリ。top に入る） ----
  ['hairstyle', 'curvy', 'rare'],
  ['hairstyle', 'miaWallace', 'rare'],
  ['hairstyle', 'frida', 'rare'],
  ['hairstyle', 'froBand', 'rare'],
  ['hairstyle', 'straight02', 'normal'],
  ['hairstyle', 'straightAndStrand', 'normal'],
  ['hairstyle', 'dreads02', 'rare'],
  ['hairstyle', 'frizzle', 'normal'],
  ['hairstyle', 'shaggy', 'normal'],
  ['hairstyle', 'shaggyMullet', 'rare'],
  ['hairstyle', 'shavedSides', 'rare'],
  ['hairstyle', 'theCaesarAndSidePart', 'normal'],
  // ---- かみのいろ（新カテゴリ。hairColor に入る） ----
  ['haircolor', 'f59797', 'normal'],
  ['haircolor', 'ecdcbf', 'normal'],
  ['haircolor', 'd6b370', 'normal'],
  ['haircolor', 'c7a2ff', 'rare'],
  ['haircolor', 'a7ffc4', 'rare'],
  ['haircolor', 'b1e2ff', 'rare'],
  ['haircolor', 'ffd6f5', 'rare'],
  ['haircolor', 'c0c0c0', 'epic'],
  // ---- め（既存カテゴリに追加。eyes に入る） ----
  ['eyes', 'cry', 'normal'],
  ['eyes', 'eyeRoll', 'normal'],
  ['eyes', 'winkWacky', 'rare'],
  ['eyes', 'xDizzy', 'rare'],
  // ---- まゆげ（新カテゴリ。eyebrows に入る） ----
  ['eyebrow', 'angryNatural', 'normal'],
  ['eyebrow', 'frownNatural', 'normal'],
  ['eyebrow', 'raisedExcitedNatural', 'normal'],
  ['eyebrow', 'sadConcernedNatural', 'normal'],
  ['eyebrow', 'unibrowNatural', 'rare'],
  ['eyebrow', 'upDownNatural', 'rare'],
  ['eyebrow', 'upDown', 'normal'],
  // ---- くち（新カテゴリ。mouth に入る） ----
  ['mouthstyle', 'concerned', 'normal'],
  ['mouthstyle', 'grimace', 'rare'],
  ['mouthstyle', 'sad', 'normal'],
  ['mouthstyle', 'vomit', 'rare'],
  // ---- ふくのいろ（新カテゴリ。clothesColor に入る） ----
  ['clothescolor', 'ff488e', 'normal'],
  ['clothescolor', 'a7ffc4', 'normal'],
  ['clothescolor', 'b1e2ff', 'normal'],
  ['clothescolor', 'ffffb1', 'normal'],
  ['clothescolor', 'ffafb9', 'normal'],
  ['clothescolor', '25557c', 'rare'],
  ['clothescolor', 'ffffff', 'rare'],
  ['clothescolor', '262e33', 'rare'],
];

const idOf = (category: AvatarItemCategory, value: string): string =>
  `av_${category}_${value}`;

// 購入価格（id → price）
export const AVATAR_ITEM_PRICES: Record<string, number> = Object.fromEntries(
  SEEDS.map(([c, v, r]) => [idOf(c, v), PRICE[r]])
);

// カテゴリ → 有料値の集合（その値を avatarConfig に入れるには対応 id の所持が必要）
export const PAID_VALUES: Record<AvatarItemCategory, Set<string>> = {
  hat: new Set(),
  glasses: new Set(),
  clothing: new Set(),
  beard: new Set(),
  hairstyle: new Set(),
  haircolor: new Set(),
  eyes: new Set(),
  eyebrow: new Set(),
  mouthstyle: new Set(),
  clothescolor: new Set(),
};
for (const [c, v] of SEEDS) PAID_VALUES[c].add(v);

/** その有料値が所持で使えるか（owned に対応 id があるか）。 */
export function ownsValue(
  category: AvatarItemCategory,
  value: string,
  owned: Set<string>
): boolean {
  return owned.has(idOf(category, value));
}
