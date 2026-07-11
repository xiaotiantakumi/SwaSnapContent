export const TICK_MS = 50;

export type RhythmConfig = {
  lanes: number;
  noteTravelMs: number;
  spawnIntervalMs: number;
  gameDurationMs: number;
  hitWindowMs: number;
  missAtMs: number;
  lives: number;
};

const NOTE_TRAVEL_MS = 1600;
const HIT_WINDOW_MS = 260;

export const DEFAULT_RHYTHM_CONFIG: RhythmConfig = {
  lanes: 2,
  noteTravelMs: NOTE_TRAVEL_MS,
  spawnIntervalMs: 800,
  gameDurationMs: 25000,
  hitWindowMs: HIT_WINDOW_MS,
  missAtMs: NOTE_TRAVEL_MS + HIT_WINDOW_MS + 150,
  lives: 3,
};

export type Note = { id: number; lane: number; spawnedAt: number; resolved: boolean };

export type RhythmGS = {
  notes: Note[];
  score: number;
  lives: number;
  over: boolean;
  nextSpawnIdx: number;
  nextNoteId: number;
  nextSpawnAt: number;
};

export function createRhythmGS(cfg?: RhythmConfig): RhythmGS {
  const c = cfg ?? DEFAULT_RHYTHM_CONFIG;
  return {
    notes: [],
    score: 0,
    lives: c.lives,
    over: false,
    nextSpawnIdx: 0,
    nextNoteId: 0,
    nextSpawnAt: 0,
  };
}

export function stepRhythm(
  gs: RhythmGS,
  elapsedMs: number,
  cfg: RhythmConfig,
  onEvent: (ev: 'hit' | 'miss' | 'over') => void
): void {
  if (gs.over) return;

  if (elapsedMs >= cfg.gameDurationMs) {
    gs.over = true;
    onEvent('over');
    return;
  }

  if (elapsedMs >= gs.nextSpawnAt) {
    const lane = gs.nextSpawnIdx % cfg.lanes;
    gs.nextSpawnIdx += 1;
    gs.nextSpawnAt += cfg.spawnIntervalMs;
    gs.notes.push({
      id: gs.nextNoteId++,
      lane,
      spawnedAt: elapsedMs,
      resolved: false,
    });
  }

  let missed = false;
  gs.notes = gs.notes.filter((n) => {
    if (n.resolved) return false;
    const age = elapsedMs - n.spawnedAt;
    if (age > cfg.missAtMs) {
      missed = true;
      return false;
    }
    return true;
  });

  if (missed && !gs.over) {
    gs.lives -= 1;
    onEvent('miss');
    if (gs.lives <= 0) {
      gs.over = true;
      onEvent('over');
      return;
    }
  }
}

export function tapRhythm(
  gs: RhythmGS,
  lane: number,
  elapsedMs: number,
  cfg: RhythmConfig,
  onEvent: (ev: 'hit' | 'miss' | 'over') => void
): boolean {
  if (gs.over) return false;

  let best: Note | null = null;
  let bestDist = Infinity;
  for (const n of gs.notes) {
    if (n.lane !== lane || n.resolved) continue;
    const age = elapsedMs - n.spawnedAt;
    const dist = Math.abs(age - cfg.noteTravelMs);
    if (dist <= cfg.hitWindowMs && dist < bestDist) {
      best = n;
      bestDist = dist;
    }
  }
  if (!best) return false;

  const hitId = best.id;
  best.resolved = true;
  gs.notes = gs.notes.filter((n) => n.id !== hitId);
  gs.score += 1;
  onEvent('hit');
  return true;
}
