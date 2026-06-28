# TODO — ゲーム拡充スプリント（〜14:00, 2026-06-28）

/loop-this-project の作業リスト。1ゲーム=ロジック→Canvas→ルート/コイン連携→仕上げ→プレイテスト。
完了したら `[x]`。各ゲームは GAMES.md のカタログに沿う。Stop フックは未登録（時間制ループのため自己管理）。

## よけよけランナー（runner）2本目
- [x] GR-A runner.ts ＋テスト7件（ジャンプ物理/二段ジャンプ不可/距離スコア/衝突/飛び越え/加速）
- [x] GR-B RunnerGame.tsx（Canvas＋タップ/スペースでジャンプ＋ジャンプボタン＋responsive）
- [x] GR-C runner ルート＋参加費/報酬連携＋registry available
- [x] GR-D 効果音(ジャンプ/crash)・難易度漸増・モバイル対応済。iPhone Playwrightで距離429・衝突over・console0 確認

## もぐらたたき（whack）3本目
- [x] GW-A whack.ts ＋テスト7件（出現/叩く+1/ばつ-1/空振り/ttl消滅/時間切れover）
- [x] GW-B WhackGame.tsx（3x3 DOMグリッド＋rAF tick＋時間バー）
- [x] GW-C whack ルート＋コイン連携＋registry＋whack称号バッジ2種
- [x] GW-D 効果音(叩く/ばつ)・iPhone Playwrightで19タップ→スコア19・console0 確認

## ブロック崩し（breakout）4本目
- [x] GB-A breakout.ts ＋テスト7件（壁反射/ブロック消去/パドル反射/落下over/全消しwon/パドルクランプ）
- [x] GB-B BreakoutGame.tsx（Canvas＋ドラッグ/左右ボタン/矢印、responsive）
- [x] GB-C breakout ルート＋コイン連携＋registry＋breakout称号2種
- [x] GB-D 効果音・iPhone Playwrightで brick破壊(score1)・描画・console0 確認

## 仕上げ（時間が許せば）
- [ ] 各ゲームの称号バッジを minigame-rewards/badge-catalog に追加
- [ ] agy UI レビューの指摘を消化
- [ ] 全体回帰（lint/build/test）＋ push で staging 更新

## agy UI レビュー消化（周-review）
- [x] RunnerGame: プレイヤー/障害物を絵文字化（アバターが走る🦊＋🌵サボテン）※高
- [x] SnakeGame: 十字を逆T字に整理＋スワイプ操作対応（指で隠れにくい）※高
- [x] WhackGame: のこり時間バーを太く＋残り25%で赤 ※中
- [x] closet: アイテム名フォント拡大(text-xs)＋装備中ローディング表示 ※低/高
- [ ] （BACKLOG）ハブ/イントロのコイン消費は誤タップ防止の確認を将来検討 ※中（現状もイントロで明示タップ必要）
- [ ] （BACKLOG）WhackGame: もぐら命中/爆弾ペナルティの画面エフェクト強化 ※小

## おちものよけ（falling）5本目
- [x] GF-A falling.ts ＋テスト7件（spawn/落下/生存スコア/円矩形衝突/離れ無衝突/クランプ）
- [x] GF-B FallingGame.tsx（アバターが よける・🪨落下・ドラッグ/ボタン・responsive）
- [x] GF-C falling ルート＋コイン連携＋registry＋falling称号2種
- [x] GF-D iPhone Playwrightで score63・🐧+🪨描画・console0 確認

## 神経衰弱（memory）6本目
- [x] GM-A memory.ts ＋テスト6件（シャッフル/めくり/一致matched/不一致busy→resolve/busy中無視/全クリアover）
- [x] GM-B MemoryGame.tsx（3x4カード・React駆動・不一致を見せて裏返す・効果音）
- [x] GM-C memory ルート＋コイン連携＋registry＋memory称号2種
- [x] GM-D iPhone Playwrightで 全6ペアそろえてクリア・score28・console0 確認
