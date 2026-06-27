// ミニゲームのコイン消費コスト（クライアント表示用）。
// サーバー api/src/shared/minigame.ts の SPEND_COSTS と一致させること（確定値はサーバー）。

export const SPEND_COSTS = {
  play: 10, // 1プレイの参加費
  continue: 15, // ゲームオーバー後のコンティニュー
} as const;

export type SpendReason = keyof typeof SPEND_COSTS;
