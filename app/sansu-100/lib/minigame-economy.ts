// ミニゲームのコイン消費コスト（クライアント表示用）。
// サーバー api/src/shared/minigame.ts の SPEND_COSTS と一致させること（確定値はサーバー）。

export const SPEND_COSTS = {
  play: 10, // 1プレイの参加費
  continue: 15, // ゲームオーバー後のコンティニュー
} as const;

export type SpendReason = keyof typeof SPEND_COSTS;

// 算数ゲート: 算数を解かないとミニゲームは遊べない。算数1回で +5、1プレイで1消費。
export const MINIGAME_PLAYS_PER_MATH = 5;
export const MINIGAME_CREDITS_CAP = 15;
