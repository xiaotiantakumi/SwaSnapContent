// ミニゲームのコイン消費コスト（クライアント表示用）。
// サーバー api/src/shared/minigame.ts の SPEND_COSTS と一致させること（確定値はサーバー）。

export const SPEND_COSTS = {
  play: 10, // 1プレイの参加費
  continue: 15, // ゲームオーバー後のコンティニュー
  dressup: 10, // 着せ替え画面の時間課金（一定時間ごと）
} as const;

export type SpendReason = keyof typeof SPEND_COSTS;

// 算数ゲート: 算数を解かないとミニゲームは遊べない。算数1回で +5、1プレイで1消費。
export const MINIGAME_PLAYS_PER_MATH = 5;
export const MINIGAME_CREDITS_CAP = 15;

// 着せ替えの時間課金: 一定時間ごとに dressup コインを引く。尽きたら強制保存して戻る。
export const DRESSUP_CHARGE_INTERVAL_SEC = 180; // 3分
export const DRESSUP_CHARGE_COINS = SPEND_COSTS.dressup; // 1回 10コイン
