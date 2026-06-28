import { bigSmile } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';

import type { AvatarConfig } from './types';

// 値は許可リスト由来なので、DiceBear のリテラル型へは安全に丸めて渡す。
type AvatarOptions = NonNullable<Parameters<typeof createAvatar>[1]>;

// AvatarConfig → SVG文字列（DiceBear bigSmile）。同じ構成は再計算しないよう memo。
const cache = new Map<string, string>();

export function buildAvatarSvg(c: AvatarConfig): string {
  const key = `${c.hair}|${c.hairColor}|${c.eyes}|${c.mouth}|${c.skinColor}|${c.accessory}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const options = {
    hair: [c.hair],
    hairColor: [c.hairColor],
    eyes: [c.eyes],
    mouth: [c.mouth],
    skinColor: [c.skinColor],
    accessories: c.accessory === 'none' ? [] : [c.accessory],
    accessoriesProbability: c.accessory === 'none' ? 0 : 100,
    backgroundColor: ['transparent'],
  };
  const svg = createAvatar(
    bigSmile,
    options as unknown as AvatarOptions
  ).toString();

  // メモリ肥大を防ぐ軽い上限。
  if (cache.size > 200) cache.clear();
  cache.set(key, svg);
  return svg;
}
