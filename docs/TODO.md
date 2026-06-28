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

## めいろ（maze）7本目
- [x] GZ-A maze.ts ＋テスト5件（生成/全セル連結=完全迷路/壁で進めない/開いた方向に進む/ゴールでover）
- [x] GZ-B MazeGame.tsx（recursive-backtracker迷路をCanvas描画・スワイプ/十字/矢印・responsive cell）
- [x] GZ-C maze ルート＋コイン連携＋registry＋maze称号2種
- [x] GZ-D iPhone Playwrightで 迷路描画・移動(壁ブロック)・console0 確認

## agy UIレビュー2回目 消化（新ゲーム）
- [x] Memory: カード裏を 🎁 に（ワクワク感）
- [x] Falling: 障害物を 👻 に（あぶないものが直感的・かわいい）
- [x] Maze: 芝生背景＋太く丸い緑の壁（プリント感を脱却）＋ボタン長押しで連続移動（幼児の操作性）
- [x] Whack: 叩いた瞬間 💥（ばつは💢）で手応え
- [ ] （BACKLOG）Breakout/Falling: ドラッグ時に指で隠れる問題→ボタン操作で代替済、必要なら追従オフセット検討

## ゲームごとの最高スコア（replay性向上）
- [x] 型に minigameScores（ゲームごとの最高点）追加（client/server/toPublic）
- [x] award-badge に gameId を受け、minigameScores[gameId]=max を保存（overall も後方互換で維持）
- [x] 各ゲームpage が gameId を送る、ハブの各カードに「🏆さいこう N」表示
- [x] ライブ検証: snake25/falling800 が別々に保存・低スコアは更新せず

## 自己ベスト更新のお祝い（全ゲーム）
- [x] award-badge が newRecord（ゲーム別ベスト更新か）を返す
- [x] NewRecordBanner（紙吹雪＋ファンファーレ＋「じこベスト こうしん！」）を7ゲームに配線
- [x] snake の旧・全体highScore表示を per-game に修正
- [x] iPhone Playwright: memory完走で record banner＋バッジ演出・console0

## ぱたぱた（flappy）8本目
- [x] GP-A flappy.ts ＋テスト7件（重力/フラップ/天井床over/すき間scored/パイプ衝突/すき間内安全）
- [x] GP-B FlappyGame.tsx（アバターが鳥・タップ/スペースで上昇・パイプ・responsive）
- [x] GP-C flappy ルート＋コイン連携＋registry＋新記録演出＋flappy称号2種
- [x] GP-D 難易度を子ども向けにやさしく調整（すき間広め・重力ゆるめ）。iPhone Playwrightで描画・console0

## メタ実績（collect them all）
- [x] ゲームたんけんか（5種で遊ぶ）／ゲームマスター（全8種で遊ぶ）バッジ。minigameScores のキー数で award-badge が自動付与。ライブ検証OK
