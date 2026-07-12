import { avataaars } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';

import {
  AVATAR_CLOTHES_COLOR,
  AVATAR_EYEBROWS,
  AVATAR_EYES,
  AVATAR_HAIR,
  AVATAR_HAIR_COLOR,
  AVATAR_MOUTH,
  AVATAR_SKIN,
  DEFAULT_AVATAR_CONFIG,
} from './avatar-options';
import { AVATAR_SHOP } from './avatar-shop';
import type { AvatarConfig } from './types';

// 値は許可リスト由来なので、DiceBear のリテラル型へは安全に丸めて渡す。
type AvatarOptions = NonNullable<Parameters<typeof createAvatar>[1]>;

const valsOf = (cat: string): string[] =>
  AVATAR_SHOP.filter((i) => i.category === cat).map((i) => i.value);

// 各フィールドの「描画してよい値」（無料＋全有料パーツ。描画は所持に関係なくOK）。
const ALLOWED: Record<keyof AvatarConfig, string[]> = {
  skinColor: AVATAR_SKIN,
  hairColor: [...AVATAR_HAIR_COLOR, ...valsOf('haircolor')],
  clothesColor: [...AVATAR_CLOTHES_COLOR, ...valsOf('clothescolor')],
  eyes: [...AVATAR_EYES, ...valsOf('eyes')],
  eyebrows: [...AVATAR_EYEBROWS, ...valsOf('eyebrow')],
  mouth: [...AVATAR_MOUTH, ...valsOf('mouthstyle')],
  top: [...AVATAR_HAIR, ...valsOf('hat'), ...valsOf('hairstyle')],
  accessory: ['none', ...valsOf('glasses')],
  facialHair: ['none', ...valsOf('beard')],
  clothing: ['shirtCrewNeck', ...valsOf('clothing')],
};

// 古い/壊れた構成（旧 bigSmile など）を、正しい値だけの構成に丸める。
// 不明な値は既定にフォールバックするので、既存ユーザーも破綻せず既定アバターになる。
export function normalizeAvatarConfig(c: Partial<AvatarConfig> | undefined): AvatarConfig {
  const out: AvatarConfig = { ...DEFAULT_AVATAR_CONFIG };
  if (c) {
    (Object.keys(ALLOWED) as (keyof AvatarConfig)[]).forEach((k) => {
      const v = c[k];
      if (typeof v === 'string' && ALLOWED[k].includes(v)) out[k] = v;
    });
  }
  return out;
}

// AvatarConfig → SVG文字列（DiceBear avataaars）。同じ構成は再計算しないよう memo。
const cache = new Map<string, string>();

export function buildAvatarSvg(raw: AvatarConfig): string {
  const c = normalizeAvatarConfig(raw);
  const key = [
    c.skinColor,
    c.hairColor,
    c.top,
    c.eyes,
    c.eyebrows,
    c.mouth,
    c.clothesColor,
    c.accessory,
    c.facialHair,
    c.clothing,
  ].join('|');
  const hit = cache.get(key);
  if (hit) return hit;

  const options = {
    skinColor: [c.skinColor],
    hairColor: [c.hairColor],
    top: [c.top],
    hatColor: [c.clothesColor],
    eyes: [c.eyes],
    eyebrows: [c.eyebrows],
    mouth: [c.mouth],
    clothing: [c.clothing],
    clothesColor: [c.clothesColor],
    accessories: c.accessory === 'none' ? [] : [c.accessory],
    accessoriesProbability: c.accessory === 'none' ? 0 : 100,
    facialHair: c.facialHair === 'none' ? [] : [c.facialHair],
    facialHairProbability: c.facialHair === 'none' ? 0 : 100,
    facialHairColor: [c.hairColor],
    backgroundColor: ['transparent'],
  };
  const svg = createAvatar(
    avataaars,
    options as unknown as AvatarOptions
  ).toString();

  // メモリ肥大を防ぐ軽い上限。
  if (cache.size > 200) cache.clear();
  cache.set(key, svg);
  return svg;
}
