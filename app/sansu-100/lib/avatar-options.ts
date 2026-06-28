import type { AvatarConfig } from './types';

// パーツ組み立て式アバター（DiceBear bigSmile スタイル）の選択肢カタログ。
// 値は DiceBear のオプションIDそのまま。色は '#' なしの16進（DiceBear 仕様）。
// このリストがクライアントの「選べるパーツ」の正。サーバー側 avatarOptions.ts と同期する。

export const AVATAR_HAIR = [
  'shortHair',
  'curlyShortHair',
  'bangs',
  'bowlCutHair',
  'straightHair',
  'wavyBob',
  'curlyBob',
  'braids',
  'bunHair',
  'froBun',
  'mohawk',
  'halfShavedHead',
  'shavedHead',
] as const;

export const AVATAR_EYES = [
  'cheery',
  'normal',
  'starstruck',
  'winking',
  'sleepy',
  'confused',
  'sad',
  'angry',
] as const;

export const AVATAR_MOUTH = [
  'teethSmile',
  'openedSmile',
  'gapSmile',
  'kawaii',
  'awkwardSmile',
  'braces',
  'unimpressed',
  'openSad',
] as const;

// 'none' は「つけない」。それ以外は DiceBear の accessories ID。
export const AVATAR_ACCESSORY = [
  'none',
  'glasses',
  'sunglasses',
  'catEars',
  'sailormoonCrown',
  'clownNose',
  'mustache',
  'faceMask',
  'sleepMask',
] as const;

// 肌の色（明→暗）。
export const AVATAR_SKIN = [
  'ffe0bd',
  'f1c27d',
  'e0ac69',
  'c68642',
  '8d5524',
] as const;

// 髪の色（自然色＋ファンシー色）。
export const AVATAR_HAIR_COLOR = [
  '1a1a1a',
  '3a2418',
  '6b4423',
  'a55728',
  'e0c068',
  'b0b0b0',
  'ff8fc8',
  '6fa8ff',
  '7ed957',
] as const;

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  hair: 'shortHair',
  hairColor: '3a2418',
  eyes: 'cheery',
  mouth: 'teethSmile',
  skinColor: 'ffe0bd',
  accessory: 'none',
};

// カテゴリ定義（ビルダー画面のタブ）。kind=parts はパーツ絵、color は色丸。
export type AvatarCategory = {
  key: keyof AvatarConfig;
  label: string;
  kind: 'parts' | 'color';
  options: readonly string[];
};

export const AVATAR_CATEGORIES: AvatarCategory[] = [
  { key: 'hair', label: 'かみがた', kind: 'parts', options: AVATAR_HAIR },
  { key: 'hairColor', label: 'かみのいろ', kind: 'color', options: AVATAR_HAIR_COLOR },
  { key: 'eyes', label: 'め', kind: 'parts', options: AVATAR_EYES },
  { key: 'mouth', label: 'くち', kind: 'parts', options: AVATAR_MOUTH },
  { key: 'skinColor', label: 'はだのいろ', kind: 'color', options: AVATAR_SKIN },
  { key: 'accessory', label: 'アクセサリ', kind: 'parts', options: AVATAR_ACCESSORY },
];
