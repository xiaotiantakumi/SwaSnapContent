import { describe, it, expect } from 'vitest';

import {
  createRhythmGS,
  stepRhythm,
  tapRhythm,
  DEFAULT_RHYTHM_CONFIG,
  type RhythmConfig,
} from '../rhythmdon-logic';

const BEATMAP_CFG: RhythmConfig = {
  ...DEFAULT_RHYTHM_CONFIG,
  gameDurationMs: 10000,
  beatmap: [
    { timeMs: 2000, lane: 1 },
    { timeMs: 2600, lane: 2 },
  ],
};

function noop(): void {}

describe('rhythmdon-logic beatmap', () => {
  it('beatmap ノーツが timeMs - noteTravelMs で出現する', () => {
    const gs = createRhythmGS(BEATMAP_CFG);

    stepRhythm(gs, 399, BEATMAP_CFG, noop);
    expect(gs.notes).toHaveLength(0);

    stepRhythm(gs, 400, BEATMAP_CFG, noop);
    expect(gs.notes).toHaveLength(1);
    expect(gs.notes[0].lane).toBe(1);
    expect(gs.notes[0].spawnedAt).toBe(400);

    stepRhythm(gs, 999, BEATMAP_CFG, noop);
    expect(gs.notes).toHaveLength(1);

    stepRhythm(gs, 1000, BEATMAP_CFG, noop);
    expect(gs.notes).toHaveLength(2);
    expect(gs.notes[1].lane).toBe(2);
    expect(gs.notes[1].spawnedAt).toBe(1000);
  });

  it('判定ライン近傍の tap で score が増える', () => {
    const gs = createRhythmGS(BEATMAP_CFG);
    stepRhythm(gs, 400, BEATMAP_CFG, noop);

    const hit = tapRhythm(gs, 1, 2000, BEATMAP_CFG, noop);
    expect(hit).toBe(true);
    expect(gs.score).toBe(1);
  });

  it('lane 違いでは score が増えない', () => {
    const gs = createRhythmGS(BEATMAP_CFG);
    stepRhythm(gs, 400, BEATMAP_CFG, noop);

    const hit = tapRhythm(gs, 0, 2000, BEATMAP_CFG, noop);
    expect(hit).toBe(false);
    expect(gs.score).toBe(0);
  });

  it('ヒット窓外では score が増えない', () => {
    const gs = createRhythmGS(BEATMAP_CFG);
    stepRhythm(gs, 400, BEATMAP_CFG, noop);

    const hit = tapRhythm(gs, 1, 1500, BEATMAP_CFG, noop);
    expect(hit).toBe(false);
    expect(gs.score).toBe(0);
  });

  it('beatmap 未指定時は従来の mechanical 生成が動く', () => {
    const cfg: RhythmConfig = {
      ...DEFAULT_RHYTHM_CONFIG,
      gameDurationMs: 5000,
    };
    const gs = createRhythmGS(cfg);

    stepRhythm(gs, 0, cfg, noop);
    expect(gs.notes).toHaveLength(1);
    expect(gs.notes[0].lane).toBe(0);
    expect(gs.notes[0].spawnedAt).toBe(0);

    stepRhythm(gs, 799, cfg, noop);
    expect(gs.notes).toHaveLength(1);

    stepRhythm(gs, 800, cfg, noop);
    expect(gs.notes).toHaveLength(2);
    expect(gs.notes[1].lane).toBe(1);
    expect(gs.notes[1].spawnedAt).toBe(800);
  });
});
