// ミニゲームのスコア→称号バッジ判定（コイン経済に影響しない名誉バッジ）。
// 既に持っているバッジは除外して「新規獲得」だけ返す。

export type MinigameId = 'snake' | 'runner' | 'whack';

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
