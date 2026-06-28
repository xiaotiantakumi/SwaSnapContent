// ミニゲームのコイン消費コスト（サーバーが正）。クライアントは reason だけ送り、
// 金額はサーバーが引く（参加費の改ざん防止）。クライアント側 app/sansu-100/lib/minigame-economy.ts と一致させること。

export type SpendReason = 'play' | 'continue';

export const SPEND_COSTS: Record<SpendReason, number> = {
  play: 10, // 1プレイの参加費
  continue: 15, // ゲームオーバー後のコンティニュー
};

export function getSpendCost(reason: string): number | undefined {
  return reason in SPEND_COSTS
    ? SPEND_COSTS[reason as SpendReason]
    : undefined;
}
