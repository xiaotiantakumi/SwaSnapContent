# TODO — ゲーム拡充スプリント（〜14:00, 2026-06-28）

/loop-this-project の作業リスト。1ゲーム=ロジック→Canvas→ルート/コイン連携→仕上げ→プレイテスト。
完了したら `[x]`。各ゲームは GAMES.md のカタログに沿う。Stop フックは未登録（時間制ループのため自己管理）。

## よけよけランナー（runner）2本目
- [x] GR-A runner.ts ＋テスト7件（ジャンプ物理/二段ジャンプ不可/距離スコア/衝突/飛び越え/加速）
- [ ] GR-B `games/RunnerGame.tsx`（Canvas＋ジャンプ操作＋モバイル対応）
- [ ] GR-C `minigame/runner/page.tsx`（参加費/報酬連携）＋ registry available
- [ ] GR-D 仕上げ（効果音・難易度・実機/Playwrightプレイテスト）

## もぐらたたき（whack）3本目
- [ ] GW-A `lib/games/whack.ts`（出現・タップ判定・制限時間・NG的）＋テスト
- [ ] GW-B `games/WhackGame.tsx`
- [ ] GW-C ルート＋コイン連携＋registry
- [ ] GW-D 仕上げ＋プレイテスト

## ブロック崩し（breakout）4本目
- [ ] GB-A `lib/games/breakout.ts`（パドル/ボール反射/ブロック）＋テスト
- [ ] GB-B `games/BreakoutGame.tsx`
- [ ] GB-C ルート＋コイン連携＋registry
- [ ] GB-D 仕上げ＋プレイテスト

## 仕上げ（時間が許せば）
- [ ] 各ゲームの称号バッジを minigame-rewards/badge-catalog に追加
- [ ] agy UI レビューの指摘を消化
- [ ] 全体回帰（lint/build/test）＋ push で staging 更新
