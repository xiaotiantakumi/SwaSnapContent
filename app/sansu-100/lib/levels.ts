import type { LevelId, Operation } from './types';

export type LevelDef = {
  id: Exclude<LevelId, 'mix'>;
  operation: Exclude<Operation, 'mixed'>;
  label: string;
  description: string;
  rangeA: [number, number];
  rangeB: [number, number];
  constraints?: {
    noCarry?: boolean;
    withCarry?: boolean;
    noBorrow?: boolean;
    withBorrow?: boolean;
    nonNegativeResult?: boolean;
    integerResult?: boolean;
    allowRemainder?: boolean;
  };
};

export const LEVELS: readonly LevelDef[] = [
  {
    id: 1,
    operation: 'add',
    label: 'たし算 Lv.1',
    description: '1けた＋1けた（くりあがりなし）',
    rangeA: [0, 9],
    rangeB: [0, 9],
    constraints: { noCarry: true },
  },
  {
    id: 2,
    operation: 'add',
    label: 'たし算 Lv.2',
    description: '1けた＋1けた（くりあがりあり）',
    rangeA: [1, 9],
    rangeB: [1, 9],
    constraints: { withCarry: true },
  },
  {
    id: 3,
    operation: 'sub',
    label: 'ひき算 Lv.1',
    description: '1けた−1けた（くりさがりなし）',
    rangeA: [0, 9],
    rangeB: [0, 9],
    constraints: { nonNegativeResult: true, noBorrow: true },
  },
  {
    id: 4,
    operation: 'sub',
    label: 'ひき算 Lv.2',
    description: '2けた−1けた（くりさがりあり）',
    rangeA: [10, 18],
    rangeB: [1, 9],
    constraints: { nonNegativeResult: true, withBorrow: true },
  },
  {
    id: 5,
    operation: 'mul',
    label: 'かけ算（九九）',
    description: '1×1〜9×9',
    rangeA: [1, 9],
    rangeB: [1, 9],
  },
  {
    id: 6,
    operation: 'div',
    label: 'わり算 Lv.1',
    description: '九九の逆算（あまりなし）',
    rangeA: [1, 81],
    rangeB: [1, 9],
    constraints: { integerResult: true, allowRemainder: false },
  },
  {
    id: 7,
    operation: 'add',
    label: 'たし算 Lv.3',
    description: '2けた＋1けた',
    rangeA: [10, 99],
    rangeB: [1, 9],
  },
  {
    id: 8,
    operation: 'add',
    label: 'たし算 Lv.4',
    description: '2けた＋2けた',
    rangeA: [10, 99],
    rangeB: [10, 99],
  },
  {
    id: 9,
    operation: 'sub',
    label: 'ひき算 Lv.3',
    description: '2けた−2けた',
    rangeA: [10, 99],
    rangeB: [10, 99],
    constraints: { nonNegativeResult: true },
  },
  {
    id: 10,
    operation: 'mul',
    label: 'かけ算 Lv.2',
    description: '2けた×1けた',
    rangeA: [10, 99],
    rangeB: [2, 9],
  },
  {
    id: 11,
    operation: 'div',
    label: 'わり算 Lv.2',
    description: '2けた÷1けた（あまりあり）',
    rangeA: [10, 99],
    rangeB: [2, 9],
    constraints: { integerResult: true, allowRemainder: true },
  },
] as const;

export function getLevel(id: Exclude<LevelId, 'mix'>): LevelDef {
  const level = LEVELS.find((l) => l.id === id);
  if (!level) throw new Error(`Unknown level: ${id}`);
  return level;
}

export const LEVELS_BY_OPERATION: Record<
  Exclude<Operation, 'mixed'>,
  LevelDef[]
> = {
  add: LEVELS.filter((l) => l.operation === 'add'),
  sub: LEVELS.filter((l) => l.operation === 'sub'),
  mul: LEVELS.filter((l) => l.operation === 'mul'),
  div: LEVELS.filter((l) => l.operation === 'div'),
};
