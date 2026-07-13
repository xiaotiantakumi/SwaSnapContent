export const W = 260;
export const H = 380;
export const PLAYER_R = 10;
export const GRAVITY = 0.35;
export const JUMP_VY = -9.5;
export const MOVE_SPEED = 4;
export const PLAT_W = 52;
export const PLAT_H = 8;
export const PLAT_GAP_MIN = 42;
export const PLAT_GAP_MAX = 72;

export type Platform = { x: number; y: number };

export interface GS {
  playerX: number;
  playerY: number;
  vy: number;
  platforms: Platform[];
  cameraY: number; // 画面上端に対応するワールドY（値が小さいほど高い）
  maxHeight: number; // これまでの最高到達スコア（登った高さ）
  over: boolean;
}

export function createGS(rand: () => number): GS {
  const platforms: Platform[] = [];
  // 最初の足場（プレイヤーの真下）
  platforms.push({ x: W / 2 - PLAT_W / 2, y: H - 30 });
  let y = H - 30;
  while (y > -H) {
    y -= PLAT_GAP_MIN + rand() * (PLAT_GAP_MAX - PLAT_GAP_MIN);
    const x = rand() * (W - PLAT_W);
    platforms.push({ x, y });
  }
  return {
    playerX: W / 2,
    playerY: H - 30 - PLAYER_R,
    vy: JUMP_VY,
    platforms,
    cameraY: 0,
    maxHeight: 0,
    over: false,
  };
}

export function tick(
  gs: GS,
  moveDir: number,
  rand: () => number,
  onEvent: (ev: 'bounce' | 'over') => void
): void {
  if (gs.over) return;

  gs.playerX += moveDir * MOVE_SPEED;
  if (gs.playerX < -PLAYER_R) gs.playerX = W + PLAYER_R;
  if (gs.playerX > W + PLAYER_R) gs.playerX = -PLAYER_R;

  const prevY = gs.playerY;
  gs.vy += GRAVITY;
  gs.playerY += gs.vy;

  // 足場との当たり判定（落下中のみ、かつ足場を上から踏んだときだけ）
  if (gs.vy > 0) {
    for (const p of gs.platforms) {
      const withinX = gs.playerX + PLAYER_R > p.x && gs.playerX - PLAYER_R < p.x + PLAT_W;
      const crossing =
        prevY + PLAYER_R <= p.y && gs.playerY + PLAYER_R >= p.y && gs.playerY + PLAYER_R <= p.y + PLAT_H + 6;
      if (withinX && crossing) {
        gs.vy = JUMP_VY;
        gs.playerY = p.y - PLAYER_R;
        onEvent('bounce');
        break;
      }
    }
  }

  // カメラをプレイヤーの最高到達点に合わせて上へスクロール
  const margin = H * 0.4;
  if (gs.playerY < gs.cameraY + margin) {
    const dy = gs.cameraY + margin - gs.playerY;
    gs.cameraY -= dy;
    gs.maxHeight = Math.max(gs.maxHeight, Math.floor(-gs.cameraY / 10));

    // 足場を上に補充する
    let topY = Math.min(...gs.platforms.map((p) => p.y));
    while (topY > gs.cameraY - H) {
      topY -= PLAT_GAP_MIN + rand() * (PLAT_GAP_MAX - PLAT_GAP_MIN);
      gs.platforms.push({ x: rand() * (W - PLAT_W), y: topY });
    }
    // 画面外に大きく外れた（下に落ちた）足場は掃除
    gs.platforms = gs.platforms.filter((p) => p.y < gs.cameraY + H + 100);
  }

  // 画面（カメラ）の下端より下に落ちたら終了
  if (gs.playerY - gs.cameraY > H + PLAYER_R * 3) {
    gs.over = true;
    onEvent('over');
  }
}
