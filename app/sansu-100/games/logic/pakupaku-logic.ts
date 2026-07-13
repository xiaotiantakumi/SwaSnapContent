import { DIR_VECTORS, type Dir } from '../../lib/minigame-core';

export type { Dir };

// ── Maze (17×15) ────────────────────────────────────────────────────────
// 0=ドット  1=壁  2=パワー餌  3=空(ドットなし)  4=ゴーストの家
export const COLS = 17;
export const ROWS = 15;
export const BASE_MAZE: readonly number[] = [
  /* 0 */ 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  /* 1 */ 1,0,0,0,1,0,0,0,3,0,0,0,1,0,0,0,1,
  /* 2 */ 1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,
  /* 3 */ 1,2,1,0,0,0,1,0,0,0,1,0,0,0,1,2,1,
  /* 4 */ 1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,
  /* 5 */ 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
  /* 6 */ 1,0,1,1,1,0,1,4,4,4,1,0,1,1,1,0,1,
  /* 7 */ 1,0,0,0,1,0,1,4,4,4,1,0,1,0,0,0,1,
  /* 8 */ 1,0,1,1,1,0,1,4,4,4,1,0,1,1,1,0,1,
  /* 9 */ 1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
  /*10 */ 1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,
  /*11 */ 1,2,1,0,0,0,1,0,0,0,1,0,0,0,1,2,1,
  /*12 */ 1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,
  /*13 */ 1,0,0,0,1,0,0,0,3,0,0,0,1,0,0,0,1,
  /*14 */ 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
];

export type GhostMode = 'house' | 'exiting' | 'chase' | 'scared' | 'dead';

export interface Ghost {
  x: number;
  y: number;
  dir: Dir;
  mode: GhostMode;
  color: string;
  scaredTicks: number;
  stepAt: number;
  exitDelay: number;
}

export interface GS {
  player: {
    x: number; y: number; dir: Dir;
    stepAt: number;
    dead: boolean;
    respawnAt: number;
    invincibleUntil: number;
  };
  ghosts: Ghost[];
  dots: Set<number>;
  powers: Set<number>;
  score: number;
  combo: number;
  lives: number;
  tick: number;
  over: boolean;
  soundOn: boolean;
}

export const PLAYER_START = { x: 8, y: 13 };
export const GHOST_HOME = { x: 8, y: 7 };
export const GHOST_EXIT = { x: 8, y: 5 };
export const DIRS: readonly Dir[] = ['up', 'down', 'left', 'right'];
export const OPP: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

export const PLAYER_TICKS_NORMAL = 2;   // 200ms
export const GHOST_TICKS_CHASE   = 3;   // 300ms
export const GHOST_TICKS_SCARED  = 5;   // 500ms
export const GHOST_TICKS_DEAD    = 1;   // 100ms (rush back)
export const SCARED_DURATION     = 100; // ticks (~10s)

export function cellAt(x: number, y: number): number {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return 1;
  return BASE_MAZE[y * COLS + x];
}

export function canPass(x: number, y: number, isGhost: boolean): boolean {
  const c = cellAt(x, y);
  if (c === 1) return false;
  if (c === 4) return isGhost;
  return true;
}

export function freeNeighbors(x: number, y: number, isGhost: boolean, exclude?: Dir): Dir[] {
  return DIRS.filter((d) => {
    if (d === exclude) return false;
    const v = DIR_VECTORS[d];
    return canPass(x + v.x, y + v.y, isGhost);
  });
}

export function bestDir(
  gx: number, gy: number,
  tx: number, ty: number,
  curDir: Dir,
  isGhost: boolean,
  invert = false,
  rand: () => number,
): Dir {
  const free = freeNeighbors(gx, gy, isGhost, OPP[curDir]);
  const pool = free.length > 0 ? free : freeNeighbors(gx, gy, isGhost);
  if (pool.length === 0) return curDir;
  const distSq = (d: Dir) => {
    const v = DIR_VECTORS[d];
    return (gx + v.x - tx) ** 2 + (gy + v.y - ty) ** 2;
  };
  if (invert) {
    return pool.reduce((b, d) => distSq(d) > distSq(b) ? d : b, pool[0]);
  }
  // Add small random chance to avoid perfectly deterministic chase
  if (rand() < 0.15 && pool.length > 1) return pool[Math.floor(rand() * pool.length)];
  return pool.reduce((b, d) => distSq(d) < distSq(b) ? d : b, pool[0]);
}

export function makeDots(): { dots: Set<number>; powers: Set<number> } {
  const dots = new Set<number>();
  const powers = new Set<number>();
  BASE_MAZE.forEach((c, i) => {
    if (c === 0) dots.add(i);
    else if (c === 2) powers.add(i);
  });
  return { dots, powers };
}

export function createGS(soundOn = false): GS {
  const { dots, powers } = makeDots();
  return {
    player: {
      x: PLAYER_START.x, y: PLAYER_START.y,
      dir: 'left',
      stepAt: 5, dead: false, respawnAt: -1, invincibleUntil: -1,
    },
    ghosts: [
      { x: 8, y: 7, dir: 'up', mode: 'house', color: '#ff4444', scaredTicks: 0, stepAt: 0, exitDelay: 0 },
      { x: 7, y: 7, dir: 'up', mode: 'house', color: '#ffaaff', scaredTicks: 0, stepAt: 0, exitDelay: 25 },
      { x: 9, y: 7, dir: 'up', mode: 'house', color: '#44ffff', scaredTicks: 0, stepAt: 0, exitDelay: 50 },
    ],
    dots, powers,
    score: 0,
    combo: 0,
    lives: 3,
    tick: 0,
    over: false,
    soundOn,
  };
}

export function tickGame(
  gs: GS,
  heldDir: Dir | null,
  rand: () => number,
  onEvent: (ev: 'dot' | 'power' | 'kill' | 'die') => void,
): void {
  if (gs.over) return;
  gs.tick++;

  // Respawn player
  if (gs.player.dead && !gs.over && gs.tick >= gs.player.respawnAt) {
    gs.player.x = PLAYER_START.x;
    gs.player.y = PLAYER_START.y;
    gs.player.dir = 'left';
    gs.player.dead = false;
    gs.player.stepAt = gs.tick + 8;
    gs.player.invincibleUntil = gs.tick + 60; // 6秒間無敵
  }

  // Move player（方向キー/ボタンが押されている間だけ進む。離すと止まる）
  if (!gs.player.dead && heldDir && gs.tick >= gs.player.stepAt) {
    const { x, y, dir } = gs.player;

    let moveDir = dir;
    // Try to change direction toward the held input
    const hv = DIR_VECTORS[heldDir];
    if (canPass(x + hv.x, y + hv.y, false)) moveDir = heldDir;

    const v = DIR_VECTORS[moveDir];
    const nx = x + v.x;
    const ny = y + v.y;
    if (canPass(nx, ny, false)) {
      gs.player.x = nx;
      gs.player.y = ny;
      gs.player.dir = moveDir;
      const idx = ny * COLS + nx;

      if (gs.dots.has(idx)) {
        gs.dots.delete(idx);
        gs.score += 10;
        onEvent('dot');
        if (gs.dots.size === 0 && gs.powers.size === 0) {
          const r = makeDots();
          gs.dots = r.dots;
          gs.powers = r.powers;
        }
      }
      if (gs.powers.has(idx)) {
        gs.powers.delete(idx);
        gs.score += 50;
        gs.combo = 0;
        gs.ghosts.forEach((g) => {
          if (g.mode === 'chase' || g.mode === 'exiting') {
            g.mode = 'scared';
            g.scaredTicks = SCARED_DURATION;
          }
        });
        onEvent('power');
      }
    }
    gs.player.stepAt = gs.tick + PLAYER_TICKS_NORMAL;
  }

  // Move ghosts
  for (const g of gs.ghosts) {
    if (gs.tick < g.stepAt) continue;
    const allowHouse = g.mode === 'house' || g.mode === 'exiting' || g.mode === 'dead';

    let newDir = g.dir;
    if (g.mode === 'house') {
      if (g.exitDelay > 0) {
        g.exitDelay--;
        g.stepAt = gs.tick + 4;
        continue;
      }
      g.mode = 'exiting';
    }
    if (g.mode === 'exiting') {
      newDir = bestDir(g.x, g.y, GHOST_EXIT.x, GHOST_EXIT.y, g.dir, true, false, rand);
      if (g.x === GHOST_EXIT.x && g.y === GHOST_EXIT.y) g.mode = 'chase';
    } else if (g.mode === 'chase') {
      newDir = bestDir(g.x, g.y, gs.player.x, gs.player.y, g.dir, false, false, rand);
    } else if (g.mode === 'scared') {
      g.scaredTicks--;
      if (g.scaredTicks <= 0) { g.mode = 'chase'; }
      else {
        newDir = bestDir(g.x, g.y, gs.player.x, gs.player.y, g.dir, false, true, rand);
      }
    } else if (g.mode === 'dead') {
      newDir = bestDir(g.x, g.y, GHOST_HOME.x, GHOST_HOME.y, g.dir, true, false, rand);
      if (g.x === GHOST_HOME.x && g.y === GHOST_HOME.y) {
        g.mode = 'house';
        g.exitDelay = 35;
        g.scaredTicks = 0;
      }
    }

    const v = DIR_VECTORS[newDir];
    const nx = g.x + v.x;
    const ny = g.y + v.y;
    if (canPass(nx, ny, allowHouse)) {
      g.x = nx; g.y = ny; g.dir = newDir;
    } else {
      // Try current direction
      const cv = DIR_VECTORS[g.dir];
      const cnx = g.x + cv.x;
      const cny = g.y + cv.y;
      if (canPass(cnx, cny, allowHouse)) { g.x = cnx; g.y = cny; }
    }

    g.stepAt = gs.tick + (
      g.mode === 'scared' ? GHOST_TICKS_SCARED :
      g.mode === 'dead'   ? GHOST_TICKS_DEAD   : GHOST_TICKS_CHASE
    );
  }

  // Collision detection (スキップ: 無敵中)
  if (!gs.player.dead && gs.tick >= gs.player.invincibleUntil) {
    const { x: px, y: py, dir: pd } = gs.player;
    for (const g of gs.ghosts) {
      if (g.x !== px || g.y !== py) continue;
      if (g.mode === 'scared') {
        // 正面衝突（プレイヤーとゴーストが真向かい）のみ死亡。横・後ろからは倒せる。
        if (pd === OPP[g.dir]) {
          killPlayer(gs, onEvent);
          break;
        } else {
          gs.score += 200 * (1 << Math.min(gs.combo, 4));
          gs.combo++;
          g.mode = 'dead';
          g.scaredTicks = 0;
          onEvent('kill');
        }
      } else if (g.mode === 'chase' || g.mode === 'exiting') {
        killPlayer(gs, onEvent);
        break;
      }
    }
  }
}

export function killPlayer(gs: GS, onEvent: (ev: 'die') => void): void {
  gs.lives--;
  gs.player.dead = true;
  gs.player.respawnAt = gs.tick + 60; // 6秒後にリスポーン
  gs.combo = 0;
  // ゴーストを全員Houseに戻して時間差で再登場（スポーン地点での即死防止）
  gs.ghosts.forEach((g, i) => {
    if (g.mode !== 'dead') {
      g.mode = 'house';
      g.x = GHOST_HOME.x;
      g.y = GHOST_HOME.y;
      g.exitDelay = 30 + i * 25;
      g.scaredTicks = 0;
    }
  });
  if (gs.lives <= 0) gs.over = true;
  onEvent('die');
}
