import { describe, it, expect } from 'vitest';

import {
  buildChant,
  COMBO_MULT_CAP,
  COMBO_STEP,
  createDarumaGS,
  DANGER_MULT_CAP,
  DOUBLE_TAKE_TELL_TICKS,
  GOAL,
  oniForRound,
  ONI_TYPES,
  pickCharTicks,
  playerPos,
  PROX_MULT_MAX,
  ROUND_BONUS,
  SCORE_PER_UNIT,
  START_LIVES,
  stepDaruma,
  TAP_ADVANCE,
  TELL_MULT,
  type DarumaGS,
  type OniType,
} from '../daruma-logic';

/** mulberry32 – returns [0, 1) */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const alwaysZero = (): number => 0;

function makeFeintOni(): OniType {
  return { ...ONI_TYPES[0], feintChance: 1, doubleTakeChance: 0, tellTicks: 1, turnTicks: 5, graceTicks: 0 };
}

function makeDoubleTakeOni(): OniType {
  return {
    ...ONI_TYPES[0],
    feintChance: 0,
    doubleTakeChance: 1,
    tellTicks: 1,
    turnTicks: 3,
    graceTicks: 0,
    minChantChars: 2,
    maxChantChars: 2,
    chantCharTicksMin: 1,
    chantCharTicksMax: 1,
  };
}

function makeDoubleTakeFeintOni(): OniType {
  return {
    ...ONI_TYPES[0],
    feintChance: 1,
    doubleTakeChance: 1,
    tellTicks: 4,
    turnTicks: 3,
    graceTicks: 0,
    minChantChars: 1,
    maxChantChars: 1,
    chantCharTicksMin: 1,
    chantCharTicksMax: 1,
  };
}

function advanceToTell(gs: DarumaGS, rand: () => number): void {
  const events: string[] = [];
  const onEvent = (ev: string) => events.push(ev);
  let guard = 500;
  while (gs.phase !== 'tell' && guard-- > 0) {
    stepDaruma(gs, 0, rand, onEvent);
  }
}

function advanceToTurn(gs: DarumaGS, rand: () => number): void {
  advanceToTell(gs, rand);
  let guard = 50;
  while (gs.phase !== 'turn' && guard-- > 0) {
    stepDaruma(gs, 0, rand, () => {});
  }
}

describe('daruma-logic', () => {
  it('createDarumaGS 初期値', () => {
    const gs = createDarumaGS(alwaysZero);
    expect(gs.round).toBe(1);
    expect(gs.lives).toBe(START_LIVES);
    expect(gs.phase).toBe('chant');
    expect(gs.committed).toBe(0);
    expect(gs.pending).toBe(0);
    expect(gs.combo).toBe(0);
    expect(gs.over).toBe(false);
    expect(gs.lastDangerMult).toBe(1);
  });

  it('チャント中タップで pending 増加（committed 不変）', () => {
    const gs = createDarumaGS(alwaysZero);
    const committedBefore = gs.committed;
    stepDaruma(gs, 3, alwaysZero, () => {});
    expect(gs.pending).toBeCloseTo(TAP_ADVANCE * 3);
    expect(gs.committed).toBe(committedBefore);
  });

  it('freeze成功で pending→committed 確定・combo++・score増加', () => {
    const gs = createDarumaGS(alwaysZero);
    gs.oni = makeDoubleTakeOni();
    gs.oni.doubleTakeChance = 0;
    gs.chant = ['だ', 'だ'];
    gs.chantIdx = 0;
    gs.chantTimer = 1;
    gs.charTicks = 1;

    stepDaruma(gs, 5, alwaysZero, () => {});
    expect(gs.pending).toBeCloseTo(TAP_ADVANCE * 5);

    advanceToTurn(gs, alwaysZero);
    expect(gs.phase).toBe('turn');

    const scoreBefore = gs.score;
    const comboBefore = gs.combo;
    let guard = 20;
    while (gs.phase === 'turn' && guard-- > 0) {
      stepDaruma(gs, 0, alwaysZero, () => {});
    }

    expect(gs.committed).toBeGreaterThan(0);
    expect(gs.pending).toBe(0);
    expect(gs.combo).toBe(comboBefore + 1);
    expect(gs.score).toBeGreaterThan(scoreBefore);
  });

  it('turn中 grace 超過タップで caught → pending没収・committed不変・lives-1・combo0', () => {
    const gs = createDarumaGS(alwaysZero);
    gs.oni = { ...ONI_TYPES[0], tellTicks: 1, turnTicks: 10, graceTicks: 1, chantCharTicksMin: 1, chantCharTicksMax: 1, minChantChars: 1, maxChantChars: 1 };
    gs.chant = ['だ'];
    gs.chantTimer = 1;
    gs.charTicks = 1;

    stepDaruma(gs, 10, alwaysZero, () => {});
    const committedBefore = gs.committed;
    const pendingBefore = gs.pending;
    expect(pendingBefore).toBeGreaterThan(0);

    advanceToTurn(gs, alwaysZero);
    expect(gs.phase).toBe('turn');

    stepDaruma(gs, 0, alwaysZero, () => {});
    stepDaruma(gs, 0, alwaysZero, () => {});
    expect(gs.phase).toBe('turn');

    stepDaruma(gs, 1, alwaysZero, () => {});
    expect(gs.pending).toBe(0);
    expect(gs.committed).toBe(committedBefore);
    expect(gs.combo).toBe(0);
    expect(gs.lives).toBe(START_LIVES - 1);
  });

  it('dangerMult が 7.5 を超えない。近接大＆nerve条件で proxMult≈3, tellMult=2.5', () => {
    const gs = createDarumaGS(alwaysZero);
    gs.oni = makeDoubleTakeOni();
    gs.oni.doubleTakeChance = 0;
    gs.committed = GOAL - TAP_ADVANCE;
    gs.pending = TAP_ADVANCE;
    gs.lastTapTick = 999;
    gs.tellStartTick = 0;

    advanceToTurn(gs, alwaysZero);
    let guard = 20;
    while (gs.phase === 'turn' && guard-- > 0) {
      stepDaruma(gs, 0, alwaysZero, () => {});
    }

    expect(gs.lastProxMult).toBeCloseTo(3.0, 1);
    expect(gs.lastTellMult).toBe(TELL_MULT);
    expect(gs.lastDangerMult).toBeLessThanOrEqual(DANGER_MULT_CAP);
    expect(gs.lastGain).toBeGreaterThan(0);
  });

  it('フェイント: feintChance=1 で TELL後 turn に入らず chant に戻り pending 保持', () => {
    const gs = createDarumaGS(alwaysZero);
    gs.oni = makeFeintOni();
    gs.chant = ['だ'];
    gs.chantTimer = 1;
    gs.charTicks = 1;

    stepDaruma(gs, 4, alwaysZero, () => {});
    const pendingAfterTap = gs.pending;
    expect(pendingAfterTap).toBeGreaterThan(0);

    advanceToTell(gs, alwaysZero);
    stepDaruma(gs, 0, alwaysZero, () => {});

    expect(gs.phase).toBe('chant');
    expect(gs.pending).toBe(pendingAfterTap);
    expect(gs.isDoubleTake).toBe(false);
  });

  it('ダブルテイク: doubleTakeChance=1 で bank後 isDoubleTake=true の短チャント→再turn、tellTimer=DOUBLE_TAKE_TELL_TICKS', () => {
    const gs = createDarumaGS(alwaysZero);
    gs.oni = makeDoubleTakeOni();

    advanceToTurn(gs, alwaysZero);
    let guard = 10;
    while (gs.phase === 'turn' && guard-- > 0) {
      stepDaruma(gs, 0, alwaysZero, () => {});
    }

    expect(gs.isDoubleTake).toBe(true);
    expect(gs.chant).toEqual(['だ']);
    expect(gs.phase).toBe('chant');

    advanceToTell(gs, alwaysZero);
    expect(gs.tellTimer).toBe(DOUBLE_TAKE_TELL_TICKS);

    stepDaruma(gs, 0, alwaysZero, () => {});
    expect(gs.phase).toBe('turn');
  });

  it('lives=0 で phase=over, over=true', () => {
    const gs = createDarumaGS(alwaysZero, { lives: 1 });
    gs.oni = { ...ONI_TYPES[0], tellTicks: 1, turnTicks: 5, graceTicks: 0, chantCharTicksMin: 1, chantCharTicksMax: 1, minChantChars: 1, maxChantChars: 1 };
    gs.chant = ['だ'];
    gs.chantTimer = 1;

    advanceToTurn(gs, alwaysZero);
    stepDaruma(gs, 1, alwaysZero, () => {});

    expect(gs.over).toBe(true);
    expect(gs.phase).toBe('over');
    expect(gs.lives).toBe(0);
  });

  it('playerPos は GOAL を超えない', () => {
    const gs = createDarumaGS(alwaysZero);
    gs.committed = 0.9;
    gs.pending = 0.5;
    expect(playerPos(gs)).toBe(GOAL);
  });

  it('buildChant は末尾が必ず だ', () => {
    const oni = ONI_TYPES[0];
    const chant = buildChant(oni, makeRng(42));
    expect(chant[chant.length - 1]).toBe('だ');
    expect(chant.length).toBeGreaterThanOrEqual(oni.minChantChars);
  });

  it('pickCharTicks は min..max の範囲内', () => {
    const oni = ONI_TYPES[0];
    const rng = makeRng(123);
    for (let i = 0; i < 50; i++) {
      const t = pickCharTicks(oni, rng);
      expect(t).toBeGreaterThanOrEqual(oni.chantCharTicksMin);
      expect(t).toBeLessThanOrEqual(oni.chantCharTicksMax);
    }
  });

  it('doubletake→feint 複合: feint後に isDoubleTake=false・次 tell は通常 tellTicks', () => {
    const gs = createDarumaGS(alwaysZero);
    // feintChance=0 でまず通常のふりむき→bank→doubleTakeChance=1 で doubletake 状態に入る
    gs.oni = { ...makeDoubleTakeFeintOni(), feintChance: 0, tellTicks: 4 };
    gs.chant = ['だ'];
    gs.chantTimer = 1;
    gs.charTicks = 1;

    advanceToTurn(gs, alwaysZero);
    let guard = 10;
    while (gs.phase === 'turn' && guard-- > 0) {
      stepDaruma(gs, 0, alwaysZero, () => {});
    }

    expect(gs.isDoubleTake).toBe(true);
    expect(gs.phase).toBe('chant');

    // ここで doubletake の再ふりむきを feint させる
    gs.oni = { ...gs.oni, feintChance: 1 };
    advanceToTell(gs, alwaysZero);
    expect(gs.tellTimer).toBe(DOUBLE_TAKE_TELL_TICKS);

    stepDaruma(gs, 0, alwaysZero, () => {});
    expect(gs.phase).toBe('chant');
    expect(gs.isDoubleTake).toBe(false);

    // 次の通常チャント完了後の tell は DOUBLE_TAKE_TELL_TICKS(=1) ではなく oni.tellTicks(=4) を使う
    gs.oni = { ...gs.oni, feintChance: 0 };
    advanceToTell(gs, alwaysZero);
    expect(gs.tellTimer).toBe(gs.oni.tellTicks);
    expect(gs.tellTimer).not.toBe(DOUBLE_TAKE_TELL_TICKS);
  });

  it('grace内タップで turnTimer が減って bank 到達', () => {
    const gs = createDarumaGS(alwaysZero);
    // turnTicks <= graceTicks なので、grace中に叩き続けても turnAge が grace を超える前に
    // turnTimer が尽きて bank する（grace を過ぎてもタップし続けた場合は別途 caught テストで検証済み）
    gs.oni = {
      ...ONI_TYPES[0],
      tellTicks: 1,
      turnTicks: 2,
      graceTicks: 5,
      chantCharTicksMin: 1,
      chantCharTicksMax: 1,
      minChantChars: 1,
      maxChantChars: 1,
    };
    gs.chant = ['だ'];
    gs.chantTimer = 1;
    gs.charTicks = 1;

    stepDaruma(gs, 3, alwaysZero, () => {});
    advanceToTurn(gs, alwaysZero);
    expect(gs.phase).toBe('turn');

    let caught = false;
    let banked = false;
    let guard = 30;
    while (gs.phase === 'turn' && guard-- > 0) {
      stepDaruma(gs, 1, alwaysZero, (ev) => {
        if (ev === 'caught') caught = true;
        if (ev === 'bank') banked = true;
      });
    }

    expect(caught).toBe(false);
    expect(banked).toBe(true);
    expect(gs.committed).toBeGreaterThan(0);
  });

  it('スコア式厳密一致: pending/combo/pos/nerve から lastGain が一致', () => {
    const gs = createDarumaGS(alwaysZero);
    gs.oni = {
      ...ONI_TYPES[0],
      tellTicks: 2,
      turnTicks: 1,
      graceTicks: 5,
      doubleTakeChance: 0,
      chantCharTicksMin: 1,
      chantCharTicksMax: 1,
      minChantChars: 1,
      maxChantChars: 1,
    };
    gs.combo = 2;
    gs.chant = ['だ'];
    gs.chantTimer = 1;
    gs.charTicks = 1;

    const chantTaps = 5;
    const tellTaps = 1;
    stepDaruma(gs, chantTaps, alwaysZero, () => {});
    expect(gs.pending).toBeCloseTo(TAP_ADVANCE * chantTaps);

    advanceToTell(gs, alwaysZero);
    stepDaruma(gs, tellTaps, alwaysZero, () => {}); // tell 中のタップも pending に加算される（nerve 狙いのリスク）

    let guard = 10;
    while (gs.phase === 'tell' && guard-- > 0) {
      stepDaruma(gs, 0, alwaysZero, () => {});
    }
    expect(gs.phase).toBe('turn');

    guard = 10;
    while (gs.phase === 'turn' && guard-- > 0) {
      stepDaruma(gs, 0, alwaysZero, () => {});
    }

    const pending = TAP_ADVANCE * (chantTaps + tellTaps);
    const pos = Math.min(GOAL, pending);
    const proxMult = 1 + (PROX_MULT_MAX - 1) * pos;
    const nerve = gs.lastTapTick > gs.tellStartTick && gs.tellStartTick >= 0;
    expect(nerve).toBe(true);
    const tellMult = nerve ? TELL_MULT : 1.0;
    const dangerMult = Math.min(DANGER_MULT_CAP, proxMult * tellMult);
    const combo = 3;
    const comboMult = Math.min(COMBO_MULT_CAP, 1 + COMBO_STEP * (combo - 1));
    const expected = Math.round(pending * SCORE_PER_UNIT * dangerMult * comboMult);

    expect(gs.lastGain).toBe(expected);
    expect(gs.lastComboMult).toBe(comboMult);
    expect(gs.lastDangerMult).toBe(dangerMult);
  });

  it('oniForRound 境界: round1,2→[0]、round3→[1]、大きい round で末尾クランプ', () => {
    expect(oniForRound(1)).toBe(ONI_TYPES[0]);
    expect(oniForRound(2)).toBe(ONI_TYPES[0]);
    expect(oniForRound(3)).toBe(ONI_TYPES[1]);
    expect(oniForRound(99)).toBe(ONI_TYPES[ONI_TYPES.length - 1]);
  });

  it('ラウンドクリア: committed>=GOAL で clear→次ラウンド combo維持・committed/pendingリセット・ROUND_BONUS', () => {
    const gs = createDarumaGS(alwaysZero);
    gs.oni = {
      ...ONI_TYPES[0],
      tellTicks: 1,
      turnTicks: 1,
      graceTicks: 5,
      doubleTakeChance: 0,
      chantCharTicksMin: 1,
      chantCharTicksMax: 1,
      minChantChars: 1,
      maxChantChars: 1,
    };
    gs.chant = ['だ'];
    gs.chantTimer = 1;
    gs.charTicks = 1;
    gs.committed = GOAL - TAP_ADVANCE;
    gs.pending = TAP_ADVANCE;
    gs.combo = 4;
    gs.round = 2;

    advanceToTurn(gs, alwaysZero);
    let guard = 20;
    while (gs.phase === 'turn' && guard-- > 0) {
      stepDaruma(gs, 0, alwaysZero, () => {});
    }

    expect(gs.phase).toBe('clear');
    const scoreAfterClear = gs.score;

    guard = 20;
    while (gs.phase === 'clear' && guard-- > 0) {
      stepDaruma(gs, 0, alwaysZero, () => {});
    }

    expect(gs.round).toBe(3);
    expect(gs.committed).toBe(0);
    expect(gs.pending).toBe(0);
    // クリア直前の bank で pending>0 のため combo は +1 されてから維持される（4→5）
    expect(gs.combo).toBe(5);
    expect(gs.score).toBe(scoreAfterClear);
    expect(gs.score).toBeGreaterThanOrEqual(ROUND_BONUS * 2);
  });

  it('pending=0 bank で combo が増えない', () => {
    const gs = createDarumaGS(alwaysZero);
    gs.oni = {
      ...ONI_TYPES[0],
      tellTicks: 1,
      turnTicks: 1,
      graceTicks: 5,
      doubleTakeChance: 0,
      chantCharTicksMin: 1,
      chantCharTicksMax: 1,
      minChantChars: 1,
      maxChantChars: 1,
    };
    gs.chant = ['だ'];
    gs.chantTimer = 1;
    gs.charTicks = 1;
    gs.combo = 5;
    gs.pending = 0;

    advanceToTurn(gs, alwaysZero);
    let guard = 20;
    while (gs.phase === 'turn' && guard-- > 0) {
      stepDaruma(gs, 0, alwaysZero, () => {});
    }

    expect(gs.combo).toBe(5);
    expect(gs.lastGain).toBe(0);
  });

  it('pending が GOAL-committed でキャップされる', () => {
    const gs = createDarumaGS(alwaysZero);
    gs.committed = GOAL - TAP_ADVANCE * 2;
    stepDaruma(gs, 10, alwaysZero, () => {});
    expect(gs.pending).toBeCloseTo(TAP_ADVANCE * 2);
    expect(gs.committed + gs.pending).toBeLessThanOrEqual(GOAL);
  });
});
