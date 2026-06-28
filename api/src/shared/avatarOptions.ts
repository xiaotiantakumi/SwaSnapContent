// パーツ組み立て式アバターの許可値（クライアント lib/avatar-options.ts と同期）。
// サーバーを権威として、未知の値はデフォルトに丸めて保存する（不正値の混入を防ぐ）。

export type AvatarConfig = {
  hair: string;
  hairColor: string;
  eyes: string;
  mouth: string;
  skinColor: string;
  accessory: string;
};

const HAIR = [
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
];
const EYES = [
  'cheery',
  'normal',
  'starstruck',
  'winking',
  'sleepy',
  'confused',
  'sad',
  'angry',
];
const MOUTH = [
  'teethSmile',
  'openedSmile',
  'gapSmile',
  'kawaii',
  'awkwardSmile',
  'braces',
  'unimpressed',
  'openSad',
];
const ACCESSORY = [
  'none',
  'glasses',
  'sunglasses',
  'catEars',
  'sailormoonCrown',
  'clownNose',
  'mustache',
  'faceMask',
  'sleepMask',
];
const SKIN = ['ffe0bd', 'f1c27d', 'e0ac69', 'c68642', '8d5524'];
const HAIR_COLOR = [
  '1a1a1a',
  '3a2418',
  '6b4423',
  'a55728',
  'e0c068',
  'b0b0b0',
  'ff8fc8',
  '6fa8ff',
  '7ed957',
];

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  hair: 'shortHair',
  hairColor: '3a2418',
  eyes: 'cheery',
  mouth: 'teethSmile',
  skinColor: 'ffe0bd',
  accessory: 'none',
};

const pick = (
  v: unknown,
  allowed: string[],
  fallback: string
): string => (typeof v === 'string' && allowed.includes(v) ? v : fallback);

/** 入力を許可値だけに丸めた安全な AvatarConfig を返す。 */
export function sanitizeAvatarConfig(input: unknown): AvatarConfig {
  const c = (input ?? {}) as Record<string, unknown>;
  return {
    hair: pick(c.hair, HAIR, DEFAULT_AVATAR_CONFIG.hair),
    hairColor: pick(c.hairColor, HAIR_COLOR, DEFAULT_AVATAR_CONFIG.hairColor),
    eyes: pick(c.eyes, EYES, DEFAULT_AVATAR_CONFIG.eyes),
    mouth: pick(c.mouth, MOUTH, DEFAULT_AVATAR_CONFIG.mouth),
    skinColor: pick(c.skinColor, SKIN, DEFAULT_AVATAR_CONFIG.skinColor),
    accessory: pick(c.accessory, ACCESSORY, DEFAULT_AVATAR_CONFIG.accessory),
  };
}
