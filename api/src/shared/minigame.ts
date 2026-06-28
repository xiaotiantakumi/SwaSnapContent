// ミニゲームのコイン消費コスト（サーバーが正）。クライアントは reason だけ送り、
// 金額はサーバーが引く（参加費の改ざん防止）。クライアント側 app/sansu-100/lib/minigame-economy.ts と一致させること。

export type SpendReason = 'play' | 'continue' | 'dressup';

export const SPEND_COSTS: Record<SpendReason, number> = {
  play: 10, // 1プレイの参加費
  continue: 15, // ゲームオーバー後のコンティニュー
  dressup: 10, // 着せ替え画面の時間課金（一定時間ごと）
};

export function getSpendCost(reason: string): number | undefined {
  return reason in SPEND_COSTS
    ? SPEND_COSTS[reason as SpendReason]
    : undefined;
}

// 算数ゲート: 算数を解かないとミニゲームは遊べない。算数1回完走で「あそべる回数」を付与し、
// 1プレイで1消費する（=5回ごとに1回は算数）。クライアント lib/minigame-economy.ts と一致させる。
export const MINIGAME_PLAYS_PER_MATH = 5; // 算数1回で増えるプレイ回数
export const MINIGAME_CREDITS_CAP = 15; // ためられる上限（3回ぶん）
