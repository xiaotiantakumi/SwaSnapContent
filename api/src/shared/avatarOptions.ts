// パーツ組み立て式アバター（avataaars）の許可値（クライアント lib/avatar-options.ts と同期）。
// サーバーを権威として、未知の値・未所持の有料パーツはデフォルトに丸める。

import { ownsValue, PAID_VALUES, type AvatarItemCategory } from './avatarShop';

export type AvatarConfig = {
  skinColor: string;
  hairColor: string;
  top: string;
  eyes: string;
  eyebrows: string;
  mouth: string;
  clothesColor: string;
  accessory: string;
  facialHair: string;
  clothing: string;
};

// 身体的アイデンティティなので無料のまま（既存6色は変更せず4色追加。app/lib/avatar-options.ts と同期）。
const SKIN = [
  'ffdbb4', 'f7d7c4', 'edb98a', 'e8b17d', 'fd9841', 'd08b5b', 'c68863',
  'ae5d29', '8d5524', '614335',
];
const HAIR_COLOR = [
  '2c1b18', '4a312c', '724133', 'a55728', 'b58143', 'e8e1e1', 'c93305',
  '65c9ff', 'ff488e', '7ed957',
];
const CLOTHES_COLOR = [
  '5199e4', '3c4f5c', 'ff5c5c', 'ffafb0', '929598', '6bd9a0', 'ffd45e', 'b15cff',
];
// 無料で選べる髪型（top のうち帽子でないもの）
const HAIRSTYLES = [
  'shortFlat', 'shortRound', 'shortCurly', 'shortWaved', 'theCaesar', 'sides',
  'dreads01', 'fro', 'curly', 'bob', 'bun', 'longButNotTooLong', 'straight01',
  'bigHair',
];
const EYES = [
  'default', 'happy', 'wink', 'hearts', 'squint', 'surprised', 'side', 'closed',
];
const EYEBROWS = [
  'defaultNatural', 'default', 'raisedExcited', 'flatNatural', 'sadConcerned',
  'angry',
];
const MOUTH = [
  'smile', 'default', 'twinkle', 'tongue', 'eating', 'serious', 'disbelief',
  'screamOpen',
];
const FREE_CLOTHING = 'shirtCrewNeck';

// PR1（カタログ拡充のみ・有料化検証はPR2）時点では、新カテゴリの値も
// まだ無条件で保存を許可する（=事実上無料相当）。PR2の pickPaid 拡張で
// 所持チェックに切り替える。値の実在確認は avatarShop.ts の SEEDS を正とする。
const valsOf = (cat: AvatarItemCategory): string[] =>
  Array.from(PAID_VALUES[cat]);
// hat(帽子)は既存どおり所持チェック対象のまま。hairstyle だけ PR1時点で無条件許可に混ぜる。
const ALL_TOP = [...HAIRSTYLES, ...valsOf('hairstyle')];
const ALL_HAIR_COLOR = [...HAIR_COLOR, ...valsOf('haircolor')];
const ALL_EYES = [...EYES, ...valsOf('eyes')];
const ALL_EYEBROWS = [...EYEBROWS, ...valsOf('eyebrow')];
const ALL_MOUTH = [...MOUTH, ...valsOf('mouthstyle')];
const ALL_CLOTHES_COLOR = [...CLOTHES_COLOR, ...valsOf('clothescolor')];

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  skinColor: 'edb98a',
  hairColor: '4a312c',
  top: 'shortFlat',
  eyes: 'default',
  eyebrows: 'defaultNatural',
  mouth: 'smile',
  clothesColor: '5199e4',
  accessory: 'none',
  facialHair: 'none',
  clothing: FREE_CLOTHING,
};

const pick = (v: unknown, allowed: string[], fallback: string): string =>
  typeof v === 'string' && allowed.includes(v) ? v : fallback;

// 有料フィールド: 無料の既定値('none'等)か、所持している有料値だけ通す。
const pickPaid = (
  v: unknown,
  category: AvatarItemCategory,
  freeValues: string[],
  owned: Set<string>,
  fallback: string
): string => {
  if (typeof v !== 'string') return fallback;
  if (freeValues.includes(v)) return v;
  if (ownsValue(category, v, owned)) return v;
  return fallback;
};

/** 入力を許可値だけに丸めた安全な AvatarConfig を返す。owned に応じて有料パーツを検証。 */
export function sanitizeAvatarConfig(
  input: unknown,
  ownedIds: string[] = []
): AvatarConfig {
  const c = (input ?? {}) as Record<string, unknown>;
  const owned = new Set(ownedIds);
  return {
    skinColor: pick(c.skinColor, SKIN, DEFAULT_AVATAR_CONFIG.skinColor),
    // PR1時点では新カテゴリ(haircolor等)もカタログ実在値なら無条件許可（有料検証はPR2）。
    hairColor: pick(c.hairColor, ALL_HAIR_COLOR, DEFAULT_AVATAR_CONFIG.hairColor),
    // top は無料の髪型 or 所持している有料の帽子（+ PR1時点ではhairstyleも無条件許可）
    top: pickPaid(c.top, 'hat', ALL_TOP, owned, DEFAULT_AVATAR_CONFIG.top),
    eyes: pick(c.eyes, ALL_EYES, DEFAULT_AVATAR_CONFIG.eyes),
    eyebrows: pick(c.eyebrows, ALL_EYEBROWS, DEFAULT_AVATAR_CONFIG.eyebrows),
    mouth: pick(c.mouth, ALL_MOUTH, DEFAULT_AVATAR_CONFIG.mouth),
    clothesColor: pick(
      c.clothesColor,
      ALL_CLOTHES_COLOR,
      DEFAULT_AVATAR_CONFIG.clothesColor
    ),
    accessory: pickPaid(c.accessory, 'glasses', ['none'], owned, 'none'),
    facialHair: pickPaid(c.facialHair, 'beard', ['none'], owned, 'none'),
    clothing: pickPaid(
      c.clothing,
      'clothing',
      [FREE_CLOTHING],
      owned,
      FREE_CLOTHING
    ),
  };
}
