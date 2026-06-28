import { LEVELS, getLevel, type LevelDef } from './levels';
import type { LevelId, Problem } from './types';

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStringToSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function digitsCarry(a: number, b: number): boolean {
  return a % 10 + b % 10 >= 10;
}

function digitsBorrow(a: number, b: number): boolean {
  return a % 10 < b % 10;
}

export function generateOne(level: LevelDef, rng: Rng): Problem {
  const { operation, rangeA, rangeB, constraints } = level;

  for (let attempt = 0; attempt < 200; attempt++) {
    let a = randInt(rng, rangeA[0], rangeA[1]);
    let b = randInt(rng, rangeB[0], rangeB[1]);

    if (operation === 'add') {
      if (constraints?.noCarry && digitsCarry(a, b)) continue;
      if (constraints?.withCarry && !digitsCarry(a, b)) continue;
      return { a, b, op: 'add', answer: a + b };
    }

    if (operation === 'sub') {
      // ensure non-negative
      if (a < b) [a, b] = [b, a];
      if (constraints?.nonNegativeResult && a < b) continue;
      if (constraints?.noBorrow && digitsBorrow(a, b)) continue;
      if (constraints?.withBorrow && !digitsBorrow(a, b)) continue;
      return { a, b, op: 'sub', answer: a - b };
    }

    if (operation === 'mul') {
      return { a, b, op: 'mul', answer: a * b };
    }

    if (operation === 'div') {
      if (constraints?.allowRemainder === false) {
        // generate as b * q form for clean integer division
        const q = randInt(rng, 1, 9);
        const divisor = randInt(rng, rangeB[0], rangeB[1]);
        const dividend = divisor * q;
        if (dividend < rangeA[0] || dividend > rangeA[1]) continue;
        return { a: dividend, b: divisor, op: 'div', answer: q };
      }
      // あまりあり: 商(answer)とあまり(remainder)の両方を答える。
      // 「あまりあり」レベルなので、割り切れる問題は除外して必ずあまりを出す。
      if (b === 0) continue;
      const remainder = a % b;
      if (remainder === 0) continue;
      return { a, b, op: 'div', answer: Math.floor(a / b), remainder };
    }
  }

  throw new Error(
    `Failed to generate problem for level ${level.id} within attempts`
  );
}

export function generateSet(
  levelId: LevelId,
  count: number,
  rng: Rng
): Problem[] {
  if (levelId === 'mix') {
    const all = LEVELS.slice();
    return Array.from({ length: count }, () => {
      const idx = Math.floor(rng() * all.length);
      return generateOne(all[idx], rng);
    });
  }
  const level = getLevel(levelId);
  return Array.from({ length: count }, () => generateOne(level, rng));
}

export function generateSetSeeded(
  levelId: LevelId,
  count: number,
  seed: number
): Problem[] {
  return generateSet(levelId, count, mulberry32(seed));
}
