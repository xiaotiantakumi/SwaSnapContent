import type { AvatarConfig } from './types';

// パーツ組み立て式アバター（DiceBear avataaars）の「無料で選べる土台」カタログ。
// 値は DiceBear のオプションIDそのまま。色は '#' なしの16進。
// ぼうし/メガネ/ふく/ひげ は有料（lib/avatar-shop.ts）。サーバー側 avatarOptions.ts と同期する。

// かみがた（無料）。avataaars の top のうち「髪型」だけ。帽子は有料。
export const AVATAR_HAIR: string[] = [
  'shortFlat',
  'shortRound',
  'shortCurly',
  'shortWaved',
  'theCaesar',
  'sides',
  'dreads01',
  'fro',
  'curly',
  'bob',
  'bun',
  'longButNotTooLong',
  'straight01',
  'bigHair',
];

export const AVATAR_EYES: string[] = [
  'default',
  'happy',
  'wink',
  'hearts',
  'squint',
  'surprised',
  'side',
  'closed',
];

export const AVATAR_EYEBROWS: string[] = [
  'defaultNatural',
  'default',
  'raisedExcited',
  'flatNatural',
  'sadConcerned',
  'angry',
];

export const AVATAR_MOUTH: string[] = [
  'smile',
  'default',
  'twinkle',
  'tongue',
  'eating',
  'serious',
  'disbelief',
  'screamOpen',
];

// 肌の色（明→暗）。
export const AVATAR_SKIN: string[] = [
  'ffdbb4',
  'edb98a',
  'fd9841',
  'd08b5b',
  'ae5d29',
  '614335',
];

// 髪の色（自然色＋ファンシー色）。
export const AVATAR_HAIR_COLOR: string[] = [
  '2c1b18',
  '4a312c',
  '724133',
  'a55728',
  'b58143',
  'e8e1e1',
  'c93305',
  '65c9ff',
  'ff488e',
  '7ed957',
];

// ふくの色。
export const AVATAR_CLOTHES_COLOR: string[] = [
  '5199e4',
  '3c4f5c',
  'ff5c5c',
  'ffafb0',
  '929598',
  '6bd9a0',
  'ffd45e',
  'b15cff',
];

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
  clothing: 'shirtCrewNeck',
};

// 無料カテゴリ（ビルダーのタブ）。kind=parts はパーツ絵、color は色丸。
export type AvatarCategory = {
  key: keyof AvatarConfig;
  label: string;
  kind: 'parts' | 'color';
  options: readonly string[];
};

export const AVATAR_FREE_CATEGORIES: AvatarCategory[] = [
  { key: 'top', label: 'かみがた', kind: 'parts', options: AVATAR_HAIR },
  { key: 'hairColor', label: 'かみのいろ', kind: 'color', options: AVATAR_HAIR_COLOR },
  { key: 'eyes', label: 'め', kind: 'parts', options: AVATAR_EYES },
  { key: 'eyebrows', label: 'まゆげ', kind: 'parts', options: AVATAR_EYEBROWS },
  { key: 'mouth', label: 'くち', kind: 'parts', options: AVATAR_MOUTH },
  { key: 'skinColor', label: 'はだのいろ', kind: 'color', options: AVATAR_SKIN },
  { key: 'clothesColor', label: 'ふくのいろ', kind: 'color', options: AVATAR_CLOTHES_COLOR },
];
