export const W = 260;
export const H = 380;
export const PADDLE_W = 56;
export const PADDLE_H = 10;
export const PLAYER_Y = H - 24;
export const CPU_Y = 24;
export const PUCK_R = 8;
export const CPU_SPEED = 2.4;
export const GAME_DURATION_MS = 30000;
export const LOSE_MARGIN = 5;
export const PUCK_SPEED_INIT = 2.6;
export const PUCK_SPEED_MAX = 6;

export interface GS {
  playerX: number;
  cpuX: number;
  puckX: number;
  puckY: number;
  puckVX: number;
  puckVY: number;
  playerScore: number;
  cpuScore: number;
  elapsedMs: number;
  over: boolean;
}

export function servePuck(gs: GS, rand: () => number): void {
  gs.puckX = W / 2;
  gs.puckY = H / 2;
  const angle = (rand() * 0.8 - 0.4) * Math.PI; // ほぼ縦方向、ややランダムに左右
  const dir = rand() < 0.5 ? 1 : -1;
  gs.puckVX = Math.sin(angle) * PUCK_SPEED_INIT;
  gs.puckVY = Math.cos(angle) * PUCK_SPEED_INIT * dir;
}

export function createGS(rand: () => number): GS {
  const gs: GS = {
    playerX: W / 2 - PADDLE_W / 2,
    cpuX: W / 2 - PADDLE_W / 2,
    puckX: W / 2,
    puckY: H / 2,
    puckVX: 0,
    puckVY: 0,
    playerScore: 0,
    cpuScore: 0,
    elapsedMs: 0,
    over: false,
  };
  servePuck(gs, rand);
  return gs;
}

export const PUCK_VY_MIN = 1.5; // これ未満だとパックがほぼ水平に張り付いて停滞するので下限を設ける

export function reflectOffPaddle(gs: GS, paddleX: number, goingDown: boolean): void {
  const hitOffset = (gs.puckX - (paddleX + PADDLE_W / 2)) / (PADDLE_W / 2); // -1..1
  gs.puckVY = goingDown ? -Math.abs(gs.puckVY) : Math.abs(gs.puckVY);
  gs.puckVX += hitOffset * 1.5;
  const speed = Math.hypot(gs.puckVX, gs.puckVY);
  if (speed > PUCK_SPEED_MAX) {
    const s = PUCK_SPEED_MAX / speed;
    gs.puckVX *= s;
    gs.puckVY *= s;
  }
  if (Math.abs(gs.puckVY) < PUCK_VY_MIN) {
    gs.puckVY = Math.sign(gs.puckVY) * PUCK_VY_MIN;
  }
}

export function tick(
  gs: GS,
  deltaMs: number,
  moveDir: number,
  rand: () => number,
  onEvent: (ev: 'hit' | 'score' | 'over') => void
): void {
  if (gs.over) return;
  gs.elapsedMs += deltaMs;

  if (gs.elapsedMs >= GAME_DURATION_MS) {
    gs.over = true;
    onEvent('over');
    return;
  }

  // プレイヤーマレット移動
  gs.playerX = Math.max(0, Math.min(W - PADDLE_W, gs.playerX + moveDir * 4));

  // CPUマレットはパックを追いかける
  const cpuCenter = gs.cpuX + PADDLE_W / 2;
  if (Math.abs(gs.puckX - cpuCenter) > 2) {
    gs.cpuX += Math.sign(gs.puckX - cpuCenter) * CPU_SPEED;
  }
  gs.cpuX = Math.max(0, Math.min(W - PADDLE_W, gs.cpuX));

  // パック移動
  gs.puckX += gs.puckVX;
  gs.puckY += gs.puckVY;

  // 左右の壁で反射
  if (gs.puckX - PUCK_R < 0) {
    gs.puckX = PUCK_R;
    gs.puckVX = Math.abs(gs.puckVX);
  } else if (gs.puckX + PUCK_R > W) {
    gs.puckX = W - PUCK_R;
    gs.puckVX = -Math.abs(gs.puckVX);
  }

  // プレイヤーマレットとの衝突（下向き移動中のみ）
  if (
    gs.puckVY > 0 &&
    gs.puckY + PUCK_R >= PLAYER_Y &&
    gs.puckY + PUCK_R <= PLAYER_Y + PADDLE_H + 8 &&
    gs.puckX >= gs.playerX - PUCK_R &&
    gs.puckX <= gs.playerX + PADDLE_W + PUCK_R
  ) {
    gs.puckY = PLAYER_Y - PUCK_R;
    reflectOffPaddle(gs, gs.playerX, true);
    onEvent('hit');
  }

  // CPUマレットとの衝突（上向き移動中のみ）
  if (
    gs.puckVY < 0 &&
    gs.puckY - PUCK_R <= CPU_Y + PADDLE_H &&
    gs.puckY - PUCK_R >= CPU_Y - 8 &&
    gs.puckX >= gs.cpuX - PUCK_R &&
    gs.puckX <= gs.cpuX + PADDLE_W + PUCK_R
  ) {
    gs.puckY = CPU_Y + PADDLE_H + PUCK_R;
    reflectOffPaddle(gs, gs.cpuX, false);
    onEvent('hit');
  }

  // ゴール判定
  if (gs.puckY - PUCK_R < -6) {
    gs.playerScore += 1;
    onEvent('score');
    servePuck(gs, rand);
  } else if (gs.puckY + PUCK_R > H + 6) {
    gs.cpuScore += 1;
    onEvent('score');
    servePuck(gs, rand);
    if (gs.cpuScore - gs.playerScore >= LOSE_MARGIN) {
      gs.over = true;
      onEvent('over');
    }
  }
}
