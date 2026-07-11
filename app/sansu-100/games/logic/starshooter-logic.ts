export const W = 260;
export const H = 340;
export const SHIP_Y = H - 24;
export const SHIP_R = 12;
export const BULLET_R = 3;
export const BULLET_SPEED = 6; // px/tick
export const ENEMY_R = 12;
export const ENEMY_SPEED = 1.4; // px/tick
export const FIRE_INTERVAL_MS = 320;
export const SPAWN_INTERVAL_MS = 850;
export const GAME_DURATION_MS = 30000;
export const LIVES = 3;

export type Bullet = { x: number; y: number };
export type Enemy = { x: number; y: number };

export interface GS {
  shipX: number;
  bullets: Bullet[];
  enemies: Enemy[];
  score: number;
  lives: number;
  elapsedMs: number;
  nextFireAt: number;
  nextSpawnAt: number;
  over: boolean;
}

export function createGS(): GS {
  return {
    shipX: W / 2,
    bullets: [],
    enemies: [],
    score: 0,
    lives: LIVES,
    elapsedMs: 0,
    nextFireAt: 0,
    nextSpawnAt: 0,
    over: false,
  };
}

export function tick(
  gs: GS,
  deltaMs: number,
  moveDir: number,
  rand: () => number,
  onEvent: (ev: 'hit' | 'miss' | 'over') => void
): void {
  if (gs.over) return;
  gs.elapsedMs += deltaMs;

  if (gs.elapsedMs >= GAME_DURATION_MS) {
    gs.over = true;
    onEvent('over');
    return;
  }

  // 自機移動
  gs.shipX = Math.max(SHIP_R, Math.min(W - SHIP_R, gs.shipX + moveDir * 4));

  // 自動連射
  if (gs.elapsedMs >= gs.nextFireAt) {
    gs.bullets.push({ x: gs.shipX, y: SHIP_Y - SHIP_R });
    gs.nextFireAt = gs.elapsedMs + FIRE_INTERVAL_MS;
  }

  // 隕石スポーン
  if (gs.elapsedMs >= gs.nextSpawnAt) {
    gs.enemies.push({ x: ENEMY_R + rand() * (W - ENEMY_R * 2), y: -ENEMY_R });
    gs.nextSpawnAt = gs.elapsedMs + SPAWN_INTERVAL_MS;
  }

  // 弾を進める
  gs.bullets = gs.bullets
    .map((b) => ({ x: b.x, y: b.y - BULLET_SPEED }))
    .filter((b) => b.y > -BULLET_R);

  // 隕石を進める
  gs.enemies = gs.enemies.map((e) => ({ x: e.x, y: e.y + ENEMY_SPEED }));

  // 弾×隕石の衝突判定
  const hitR = BULLET_R + ENEMY_R;
  const survivingEnemies: Enemy[] = [];
  for (const e of gs.enemies) {
    let hit = false;
    gs.bullets = gs.bullets.filter((b) => {
      if (hit) return true;
      const dx = b.x - e.x;
      const dy = b.y - e.y;
      if (dx * dx + dy * dy <= hitR * hitR) {
        hit = true;
        return false;
      }
      return true;
    });
    if (hit) {
      gs.score += 1;
      onEvent('hit');
    } else {
      survivingEnemies.push(e);
    }
  }
  gs.enemies = survivingEnemies;

  // 自機ラインを通り過ぎた隕石はミス扱い
  const remaining: Enemy[] = [];
  let missed = false;
  for (const e of gs.enemies) {
    if (e.y - ENEMY_R > SHIP_Y + SHIP_R) {
      missed = true;
    } else {
      remaining.push(e);
    }
  }
  gs.enemies = remaining;
  if (missed) {
    gs.lives -= 1;
    onEvent('miss');
    if (gs.lives <= 0) {
      gs.over = true;
      onEvent('over');
    }
  }
}
