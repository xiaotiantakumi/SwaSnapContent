// ミニゲームのスコア→称号バッジ判定（コイン経済に影響しない名誉バッジ）。
// 既に持っているバッジは除外して「新規獲得」だけ返す。

export type MinigameId =
  | 'snake'
  | 'runner'
  | 'whack'
  | 'breakout'
  | 'falling'
  | 'memory'
  | 'maze'
  | 'flappy'
  | 'numberpop';

// gameId ごとの { しきい値: バッジID }（昇順）
const THRESHOLDS: Record<MinigameId, { score: number; badgeId: string }[]> = {
  snake: [
    { score: 10, badgeId: 'snake_charmer' },
    { score: 30, badgeId: 'snake_king' },
  ],
  runner: [
    { score: 500, badgeId: 'runner_ace' },
    { score: 1500, badgeId: 'runner_wind' },
  ],
  whack: [
    { score: 15, badgeId: 'whack_master' },
    { score: 30, badgeId: 'whack_legend' },
  ],
  breakout: [
    { score: 15, badgeId: 'breakout_pro' },
    { score: 28, badgeId: 'breakout_master' },
  ],
  falling: [
    { score: 500, badgeId: 'falling_pro' },
    { score: 1200, badgeId: 'falling_master' },
  ],
  memory: [
    { score: 1, badgeId: 'memory_clear' },
    { score: 4, badgeId: 'memory_ace' },
  ],
  maze: [
    { score: 1, badgeId: 'maze_explorer' },
    { score: 5, badgeId: 'maze_master' },
  ],
  flappy: [
    { score: 10, badgeId: 'flappy_pro' },
    { score: 30, badgeId: 'flappy_master' },
  ],
  numberpop: [
    { score: 30, badgeId: 'numberpop_starter' },
    { score: 100, badgeId: 'numberpop_master' },
  ],
};

/** スコアで到達したバッジのうち、まだ持っていないものを返す。 */
export function evaluateMinigameBadges(
  gameId: MinigameId,
  score: number,
  ownedBadges: string[]
): string[] {
  const owned = new Set(ownedBadges);
  return (THRESHOLDS[gameId] ?? [])
    .filter((t) => score >= t.score && !owned.has(t.badgeId))
    .map((t) => t.badgeId);
}
