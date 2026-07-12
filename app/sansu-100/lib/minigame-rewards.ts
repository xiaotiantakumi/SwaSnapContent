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
  | 'pakupaku'
  | 'oboete'
  | 'swipesort'
  | 'rhythmdon'
  | 'starshooter'
  | 'ponpon'
  | 'airhockey'
  | 'kururin'
  | 'hitofude'
  | 'daruma';

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
  pakupaku: [
    { score: 500, badgeId: 'pakupaku_debut' },
    { score: 2000, badgeId: 'pakupaku_glutton' },
  ],
  oboete: [
    { score: 5, badgeId: 'oboete_sharp' },
    { score: 10, badgeId: 'oboete_genius' },
  ],
  swipesort: [
    { score: 15, badgeId: 'swipesort_quick' },
    { score: 30, badgeId: 'swipesort_lightning' },
  ],
  rhythmdon: [
    { score: 15, badgeId: 'rhythmdon_groovy' },
    { score: 25, badgeId: 'rhythmdon_maestro' },
  ],
  starshooter: [
    { score: 15, badgeId: 'starshooter_ace' },
    { score: 35, badgeId: 'starshooter_hero' },
  ],
  ponpon: [
    { score: 30, badgeId: 'ponpon_climber' },
    { score: 80, badgeId: 'ponpon_skyhigh' },
  ],
  airhockey: [
    { score: 5, badgeId: 'airhockey_rookie' },
    { score: 10, badgeId: 'airhockey_champion' },
  ],
  kururin: [
    { score: 2, badgeId: 'kururin_roller' },
    { score: 5, badgeId: 'kururin_master' },
  ],
  hitofude: [
    { score: 3, badgeId: 'hitofude_artist' },
    { score: 6, badgeId: 'hitofude_master' },
  ],
  daruma: [
    { score: 300, badgeId: 'daruma_stopper' },
    { score: 1000, badgeId: 'daruma_master' },
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
