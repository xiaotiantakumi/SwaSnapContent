import { describe, it, expect } from 'vitest';
import {
  SHOP_CATALOG,
  SHOP_BY_ID,
  ITEM_PRICES,
  getItemDef,
  type ItemRarity,
} from '../shop-catalog';

const VALID_SLOTS = ['hat', 'background', 'frame', 'effect'];

describe('shop-catalog', () => {
  it('price は ITEM_PRICES[rarity] と一致する', () => {
    for (const item of SHOP_CATALOG) {
      expect(item.price).toBe(ITEM_PRICES[item.rarity]);
    }
  });

  it('id は重複しない', () => {
    const ids = SHOP_CATALOG.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('slot はすべて有効なスロット', () => {
    for (const item of SHOP_CATALOG) {
      expect(VALID_SLOTS).toContain(item.slot);
    }
  });

  it('render.kind が slot と整合する', () => {
    const expected: Record<string, string> = {
      hat: 'emojiOverlay',
      background: 'bgClass',
      frame: 'frameClass',
      effect: 'effectClass',
    };
    for (const item of SHOP_CATALOG) {
      expect(item.render.kind).toBe(expected[item.slot]);
    }
  });

  it('SHOP_BY_ID / getItemDef が引ける', () => {
    for (const item of SHOP_CATALOG) {
      expect(SHOP_BY_ID[item.id]).toBe(item);
      expect(getItemDef(item.id)).toBe(item);
    }
    expect(getItemDef('does-not-exist')).toBeUndefined();
  });

  it('各レアリティ・各スロットが最低1つある', () => {
    const rarities: ItemRarity[] = ['normal', 'rare', 'epic'];
    for (const r of rarities) {
      expect(SHOP_CATALOG.some((i) => i.rarity === r)).toBe(true);
    }
    for (const s of VALID_SLOTS) {
      expect(SHOP_CATALOG.some((i) => i.slot === s)).toBe(true);
    }
  });
});
