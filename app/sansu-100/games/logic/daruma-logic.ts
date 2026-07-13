export const TICK_MS = 100;
export const FIELD = 1.0;
export const GOAL = 1.0;
export const TAP_ADVANCE = 0.010;
export const SCORE_PER_UNIT = 1000;
export const COMBO_STEP = 0.15;
export const COMBO_MULT_CAP = 4.0;
export const ROUND_BONUS = 500;
export const START_LIVES = 3;
export const PROX_MULT_MAX = 3.0;
export const TELL_MULT = 2.5;
export const DANGER_MULT_CAP = 7.5;
export const CLEAR_TICKS = 12;
export const RESOLVE_SAFE_TICKS = 6;
export const RESOLVE_CAUGHT_TICKS = 10;
export const DOUBLE_TAKE_CHARS = 1;
export const DOUBLE_TAKE_TELL_TICKS = 1;
export const CHANT_BASE = ['だ', 'る', 'ま', 'さ', 'ん', 'が', 'こ', 'ろ', 'ん', 'だ'] as const;

export interface OniType {
  id: string;
  label: string;
  chantCharTicksMin: number;
  chantCharTicksMax: number;
  tellTicks: number;
  turnTicks: number;
  graceTicks: number;
  feintChance: number;
  doubleTakeChance: number;
  minChantChars: number;
  maxChantChars: number;
}

export const ONI_TYPES: OniType[] = [
  {
    id: 'beginner',
    label: 'ふつうのだるま',
    chantCharTicksMin: 6,
    chantCharTicksMax: 9,
    tellTicks: 6,
    turnTicks: 10,
    graceTicks: 3,
    feintChance: 0.0,
    doubleTakeChance: 0.0,
    minChantChars: 8,
    maxChantChars: 10,
  },
  {
    id: 'normal',
    label: 'ちょっとはやい',
    chantCharTicksMin: 5,
    chantCharTicksMax: 8,
    tellTicks: 5,
    turnTicks: 9,
    graceTicks: 2,
    feintChance: 0.15,
    doubleTakeChance: 0.05,
    minChantChars: 6,
    maxChantChars: 10,
  },
  {
    id: 'tricky',
    label: 'フェイントだるま',
    chantCharTicksMin: 4,
    chantCharTicksMax: 7,
    tellTicks: 4,
    turnTicks: 8,
    graceTicks: 2,
    feintChance: 0.3,
    doubleTakeChance: 0.15,
    minChantChars: 5,
    maxChantChars: 10,
  },
  {
    id: 'fast',
    label: 'はやわざだるま',
    chantCharTicksMin: 3,
    chantCharTicksMax: 6,
    tellTicks: 3,
    turnTicks: 7,
    graceTicks: 2,
    feintChance: 0.25,
    doubleTakeChance: 0.25,
    minChantChars: 5,
    maxChantChars: 9,
  },
  {
    id: 'master',
    label: 'だるまマスター',
    chantCharTicksMin: 2,
    chantCharTicksMax: 5,
    tellTicks: 3,
    turnTicks: 6,
    graceTicks: 1,
    feintChance: 0.35,
    doubleTakeChance: 0.35,
    minChantChars: 4,
    maxChantChars: 9,
  },
];

export function oniForRound(round: number): OniType {
  const idx = Math.min(Math.floor((round - 1) / 2), ONI_TYPES.length - 1);
  return ONI_TYPES[Math.max(0, idx)];
}

export type DarumaPhase = 'chant' | 'tell' | 'turn' | 'resolve' | 'clear' | 'over';
export type ResolveKind = 'safe' | 'caught';

export interface DarumaGS {
  phase: DarumaPhase;
  round: number;
  committed: number;
  pending: number;
  lives: number;
  score: number;
  combo: number;
  over: boolean;
  oni: OniType;
  chant: string[];
  chantIdx: number;
  chantTimer: number;
  charTicks: number;
  tickCount: number;
  tellTimer: number;
  tellStartTick: number;
  turnStartTick: number;
  turnTimer: number;
  willTurn: boolean;
  isDoubleTake: boolean;
  lastTapTick: number;
  resolveKind: ResolveKind | null;
  resolveTimer: number;
  clearTimer: number;
  lastGain: number;
  lastProxMult: number;
  lastTellMult: number;
  lastComboMult: number;
  lastDangerMult: number;
}

export function playerPos(gs: DarumaGS): number {
  return Math.min(GOAL, gs.committed + gs.pending);
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

export function pickCharTicks(oni: OniType, rand: () => number): number {
  const span = oni.chantCharTicksMax - oni.chantCharTicksMin + 1;
  return oni.chantCharTicksMin + Math.floor(rand() * span);
}

export function buildChant(oni: OniType, rand: () => number): string[] {
  const span = oni.maxChantChars - oni.minChantChars + 1;
  const n = oni.minChantChars + Math.floor(rand() * span);
  return [...CHANT_BASE.slice(0, n - 1), 'だ'];
}

export function buildDoubleTakeChant(): string[] {
  return Array.from<string>({ length: DOUBLE_TAKE_CHARS }).fill('だ');
}

function startNextChant(gs: DarumaGS, rand: () => number): void {
  gs.phase = 'chant';
  gs.chant = buildChant(gs.oni, rand);
  gs.chantIdx = 0;
  gs.charTicks = pickCharTicks(gs.oni, rand);
  gs.chantTimer = gs.charTicks;
  gs.tellStartTick = -1;
  gs.isDoubleTake = false;
  gs.resolveKind = null;
}

function applyBank(gs: DarumaGS): void {
  const pos = playerPos(gs);
  const proxMult = 1 + (PROX_MULT_MAX - 1) * clamp(pos, 0, 1);
  const nerve = gs.lastTapTick > gs.tellStartTick && gs.tellStartTick >= 0;
  const tellMult = nerve ? TELL_MULT : 1.0;
  const dangerMult = Math.min(DANGER_MULT_CAP, proxMult * tellMult);
  const combo = gs.pending > 0 ? gs.combo + 1 : gs.combo;
  const comboMult = Math.min(COMBO_MULT_CAP, 1 + COMBO_STEP * (combo - 1));
  const gained = Math.round(gs.pending * SCORE_PER_UNIT * dangerMult * comboMult);

  gs.committed += gs.pending;
  gs.pending = 0;
  gs.combo = combo;
  gs.score += gained;
  gs.lastGain = gained;
  gs.lastProxMult = proxMult;
  gs.lastTellMult = tellMult;
  gs.lastComboMult = comboMult;
  gs.lastDangerMult = dangerMult;
}

function applyCaught(gs: DarumaGS): void {
  gs.pending = 0;
  gs.combo = 0;
  gs.lives -= 1;
  gs.resolveKind = 'caught';
}

export function createDarumaGS(rand: () => number, opts?: { lives?: number }): DarumaGS {
  const oni = oniForRound(1);
  const charTicks = pickCharTicks(oni, rand);
  return {
    phase: 'chant',
    round: 1,
    committed: 0,
    pending: 0,
    lives: opts?.lives ?? START_LIVES,
    score: 0,
    combo: 0,
    over: false,
    oni,
    chant: buildChant(oni, rand),
    chantIdx: 0,
    chantTimer: charTicks,
    charTicks,
    tickCount: 0,
    tellTimer: 0,
    tellStartTick: -1,
    turnStartTick: -1,
    turnTimer: 0,
    willTurn: true,
    isDoubleTake: false,
    lastTapTick: -1,
    resolveKind: null,
    resolveTimer: 0,
    clearTimer: 0,
    lastGain: 0,
    lastProxMult: 1,
    lastTellMult: 1,
    lastComboMult: 1,
    lastDangerMult: 1,
  };
}

export type DarumaEvent =
  | 'chant'
  | 'tell'
  | 'turn'
  | 'feint'
  | 'bank'
  | 'caught'
  | 'clear'
  | 'doubletake'
  | 'over';

export function stepDaruma(
  gs: DarumaGS,
  taps: number,
  rand: () => number,
  onEvent: (ev: DarumaEvent) => void
): void {
  if (gs.over) return;

  switch (gs.phase) {
    case 'chant': {
      if (taps > 0) {
        gs.pending = Math.min(gs.pending + TAP_ADVANCE * taps, GOAL - gs.committed);
        gs.lastTapTick = gs.tickCount;
      }
      gs.chantTimer--;
      if (gs.chantTimer <= 0) {
        gs.chantIdx++;
        if (gs.chantIdx >= gs.chant.length) {
          gs.phase = 'tell';
          gs.tellTimer = gs.isDoubleTake ? DOUBLE_TAKE_TELL_TICKS : gs.oni.tellTicks;
          gs.tellStartTick = gs.tickCount;
          gs.willTurn = !(rand() < gs.oni.feintChance);
          onEvent('tell');
        } else {
          gs.chantTimer = gs.charTicks;
          onEvent('chant');
        }
      }
      break;
    }
    case 'tell': {
      if (taps > 0) {
        gs.pending = Math.min(gs.pending + TAP_ADVANCE * taps, GOAL - gs.committed);
        gs.lastTapTick = gs.tickCount;
      }
      gs.tellTimer--;
      if (gs.tellTimer <= 0) {
        if (!gs.willTurn) {
          onEvent('feint');
          startNextChant(gs, rand);
        } else {
          gs.phase = 'turn';
          gs.turnStartTick = gs.tickCount;
          gs.turnTimer = gs.oni.turnTicks;
          onEvent(gs.isDoubleTake ? 'doubletake' : 'turn');
        }
      }
      break;
    }
    case 'turn': {
      const turnAge = gs.tickCount - gs.turnStartTick;
      if (taps > 0 && turnAge > gs.oni.graceTicks) {
        applyCaught(gs);
        onEvent('caught');
        if (gs.lives <= 0) {
          gs.phase = 'over';
          gs.over = true;
          onEvent('over');
        } else {
          gs.phase = 'resolve';
          gs.resolveTimer = RESOLVE_CAUGHT_TICKS;
        }
        break;
      }

      const withinGraceTap = taps > 0 && turnAge <= gs.oni.graceTicks;
      if (taps === 0 || withinGraceTap) {
        gs.turnTimer--;
        if (gs.turnTimer <= 0) {
          applyBank(gs);
          onEvent('bank');

          if (gs.committed >= GOAL) {
            gs.phase = 'clear';
            gs.clearTimer = CLEAR_TICKS;
            gs.score += ROUND_BONUS * gs.round;
            onEvent('clear');
          } else if (rand() < gs.oni.doubleTakeChance) {
            gs.phase = 'chant';
            gs.isDoubleTake = true;
            gs.chant = buildDoubleTakeChant();
            gs.chantIdx = 0;
            gs.charTicks = pickCharTicks(gs.oni, rand);
            gs.chantTimer = gs.charTicks;
            gs.tellStartTick = -1;
          } else {
            gs.phase = 'resolve';
            gs.resolveKind = 'safe';
            gs.resolveTimer = RESOLVE_SAFE_TICKS;
            gs.isDoubleTake = false;
          }
        }
      }
      break;
    }
    case 'resolve': {
      gs.resolveTimer--;
      if (gs.resolveTimer <= 0) {
        startNextChant(gs, rand);
        onEvent('chant');
      }
      break;
    }
    case 'clear': {
      gs.clearTimer--;
      if (gs.clearTimer <= 0) {
        gs.round++;
        gs.committed = 0;
        gs.pending = 0;
        gs.oni = oniForRound(gs.round);
        startNextChant(gs, rand);
        onEvent('chant');
      }
      break;
    }
    case 'over':
      break;
  }

  gs.tickCount++;
}
