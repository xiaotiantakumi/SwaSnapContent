import { describe, it, expect } from 'vitest';
import { evaluateMinigameBadges } from '../minigame-rewards';

describe('evaluateMinigameBadges', () => {
  it('スコアで到達したバッジを返す', () => {
    expect(evaluateMinigameBadges('snake', 9, [])).toEqual([]);
    expect(evaluateMinigameBadges('snake', 10, [])).toEqual(['snake_charmer']);
    expect(evaluateMinigameBadges('snake', 30, [])).toEqual([
      'snake_charmer',
      'snake_king',
    ]);
  });

  it('すでに持っているバッジは除外する', () => {
    expect(evaluateMinigameBadges('snake', 30, ['snake_charmer'])).toEqual([
      'snake_king',
    ]);
    expect(
      evaluateMinigameBadges('snake', 30, ['snake_charmer', 'snake_king'])
    ).toEqual([]);
  });

  it('ゲームごとに別のしきい値', () => {
    expect(evaluateMinigameBadges('runner', 500, [])).toEqual(['runner_ace']);
    expect(evaluateMinigameBadges('runner', 1500, [])).toEqual([
      'runner_ace',
      'runner_wind',
    ]);
  });
});
