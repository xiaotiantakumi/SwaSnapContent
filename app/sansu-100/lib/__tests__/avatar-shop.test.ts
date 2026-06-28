import { describe, it, expect } from 'vitest';

import { DEFAULT_AVATAR_CONFIG } from '../avatar-options';
import {
  AVATAR_SHOP,
  AVATAR_ITEM_FIELD,
  getAvatarItem,
  ownedValuesOf,
  previewConfigWith,
} from '../avatar-shop';

describe('avatar-shop', () => {
  it('id は av_<category>_<value> で一意', () => {
    const ids = AVATAR_SHOP.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const it of AVATAR_SHOP) {
      expect(it.id).toBe(`av_${it.category}_${it.value}`);
      expect(it.price).toBeGreaterThan(0);
    }
  });

  it('4カテゴリそろっていて十分な種類がある', () => {
    for (const cat of ['hat', 'glasses', 'clothing', 'beard'] as const) {
      const n = AVATAR_SHOP.filter((i) => i.category === cat).length;
      expect(n).toBeGreaterThanOrEqual(4);
    }
    expect(AVATAR_SHOP.length).toBeGreaterThanOrEqual(24);
  });

  it('ownedValuesOf は所持している値だけ返す', () => {
    const hat = AVATAR_SHOP.find((i) => i.category === 'hat')!;
    const glasses = AVATAR_SHOP.find((i) => i.category === 'glasses')!;
    const ownedVals = ownedValuesOf('hat', [hat.id, glasses.id]);
    expect(ownedVals).toContain(hat.value);
    expect(ownedVals).not.toContain(glasses.value);
    expect(ownedValuesOf('hat', [])).toEqual([]);
  });

  it('previewConfigWith は該当フィールドだけ差し替える', () => {
    const item = AVATAR_SHOP.find((i) => i.category === 'glasses')!;
    const cfg = previewConfigWith('glasses', item.value);
    expect(cfg[AVATAR_ITEM_FIELD.glasses]).toBe(item.value);
    expect(cfg.top).toBe(DEFAULT_AVATAR_CONFIG.top);
  });

  it('getAvatarItem は id 解決できる', () => {
    const it = AVATAR_SHOP[0];
    expect(getAvatarItem(it.id)).toBe(it);
    expect(getAvatarItem('nope')).toBeUndefined();
  });
});
