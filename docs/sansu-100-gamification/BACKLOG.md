# BACKLOG — 進捗の正（1周1タスク）

凡例: `[ ]` 未着手 / `[~]` 着手中 / `[x]` 完了。各タスクに受入基準を付す。
依存順（基盤 → コイン → ショップ → ゲーム基盤 → ゲーム本体 → 仕上げ）を守る。

## 基盤（先に1回だけ）
- [x] B0-1 作業ブランチ `feat/sansu-100-gamification` 作成、`docs/sansu-100-gamification/` 6ファイル作成
      受入: ブランチ上で6ファイルが存在し、`/loop` 起動文が通る
- [x] B0-2 `app/sansu-100/lib/minigame-core.ts`: rAFループ（固定タイムステップ/accumulator）・入力抽象
      （キーボード＋オンスクリーン）・スコア管理・Canvas描画ヘルパ ＋ `__tests__/minigame-core.test.ts`
      受入: `npm test` 緑。タブ非アクティブで暴れない設計（rAF, setInterval不使用）
      → 完了(周1): advance/nextDirection/tickIntervalForScore 等を純粋関数化しテスト11件緑。Canvas/rAFは薄いラッパ

## 第1弾 コイン経済（ゲーム参加費の前提）
- [ ] C1 型拡張: `app/sansu-100/lib/types.ts` と `api/src/shared/sansuTypes.ts` に
      `coins/ownedItems/equippedItems/dailyCoinDate/dailyCoinsEarned/dailySessionCount/minigameHighScore`（全optional）、
      `ItemSlot`/`EquippedItems` 型、`toPublic` にデフォルト付与（`coins: e.coins ?? 0` 等）
      受入: build緑、既存ユーザー（新カラム無し）が壊れない
- [ ] C2 `app/sansu-100/lib/coins.ts` ＋ `api/src/shared/coins.ts`（同一ロジック複製）:
      `calculateCoins(ctx)` = 1日1回目+50/以降+10/ベスト更新+20/ストリーク到達3日+10・7日+30/**1日上限150**/減点没収なし/日付跨ぎでリセット。
      ＋ `app/sansu-100/lib/__tests__/coins.test.ts`
      受入: `npm test` 緑。上限・日付跨ぎ・リタイヤ0・常に>=0 を網羅
- [ ] C3 `app/sansu-100/lib/session-result.ts` の `finishSession` に `calculateCoins` 統合。
      `FinishSessionResult` に `coinsEarned` と `coinBreakdown`（表示用）を追加。daily系3フィールドを更新
      受入: 既存 `session-result.test.ts` 緑 ＋ コイン反映の新テスト
- [ ] C4 `api/src/functions/sansuSessions.ts`: サーバー `calculateCoins` 統合で `coins` 加算、
      **冪等バグ修正**（`createEntity` 成功時のみ集計・コイン加算。409 は skip）、レスポンスを `{ ok, user: toPublic(...) }` に
      受入: `cd api && npm run build` 緑。同一セッション再送で二重加算しない（手動確認 or ロジックレビュー）
- [ ] C5 `app/sansu-100/lib/api-client.ts`: `submitSession` 戻り値を `{ ok; user? }` 化、`getUser` で残高再同期。
      `app/sansu-100/play/page.tsx`: 送信応答の `user` で `saveUser`（残高をサーバー値に確定）
      受入: build緑。完走後ローカル残高がサーバー値に一致
- [ ] C6 `app/sansu-100/components/CoinBalance.tsx`（🪙＋数値、増加アニメ）。`result/page.tsx` に獲得breakdown、
      `page.tsx`（ホーム）に残高表示
      受入: 完走でコイン増/上限150で頭打ち/リロードでサーバー値一致/リタイヤで増えない をブラウザ確認

## 第2弾 ショップ＋着せ替え
- [ ] S1 `app/sansu-100/lib/shop-catalog.ts`（`ShopItemDef`/`SHOP_CATALOG`/`ITEM_PRICES{normal:50,rare:200,epic:1000}`、
      帽子/背景/フレーム/エフェクト）＋ `api/src/shared/shopCatalog.ts`（価格/スロットのみ複製）＋ `shop-catalog.test.ts`
      受入: `npm test` 緑。price=ITEM_PRICES[rarity] 整合、id重複なし
- [ ] S2 `app/sansu-100/components/AvatarDisplay.tsx`（背景→フレーム→絵文字→帽子→エフェクトを重ね描画）。
      既存の絵文字直書き（`page.tsx`/`components/UserTile.tsx`/`result/page.tsx`）を置換
      受入: 未装備ユーザーは従来見た目、装備で重なる をブラウザ確認
- [ ] S3 `api/src/functions/sansuPurchase.ts`（購入=残高検証+減算+ownedItems追加 / equip=装備変更）＋
      `api/src/index.ts` 登録 ＋ `api-client.ts` に `purchase`/`equip`
      受入: `cd api && npm run build` 緑。残高不足で409、価格はサーバーが引く
- [ ] S4 `app/sansu-100/shop/page.tsx` ＋ `closet/page.tsx`（タブ統合可）＋ ホーム導線
      受入: 購入で残高減・所持追加・装備反映、不足で買えない、リロード維持 をブラウザ確認

## 第3弾 ミニゲーム基盤＋報酬
- [ ] G0 `api/src/functions/sansuSpend.ts`（参加費/コンティニュー=残高検証+減算）＋
      `api/src/functions/sansuAwardBadge.ts`（earnedBadges追加のみ・経済影響ゼロ）＋ `index.ts` 登録 ＋ `api-client.ts` に `spend`/`awardBadge`
      受入: `cd api && npm run build` 緑。残高不足で開始不可（409）
- [ ] G0b `app/sansu-100/lib/minigame-rewards.ts`（スコア→限定バッジ判定）＋ `badge-catalog.ts` に `category:'minigame'` 称号追加 ＋
      `app/sansu-100/minigame/page.tsx`（ハブ: ゲーム選択・参加費表示・結果演出は `BadgeUnlockOverlay` 再利用）
      受入: build緑。ハブからゲームに入れる、報酬演出が出る

## 第4弾 ゲーム本体（1ゲーム=周A〜D。GAMES.md 参照）
### スネーク（基準実装）
- [ ] GS-A `lib/games/snake.ts`（衝突/成長/food配置/score、純粋関数）＋ `__tests__/snake.test.ts`
- [ ] GS-B `games/SnakeGame.tsx`（minigame-core に乗せて Canvas+操作）
- [ ] GS-C コイン消費（参加費/コンティニュー）＋報酬連携 ＋ **ブラウザ3回プレイ動作確認**
- [ ] GS-D 仕上げ（効果音 `sound-presets.ts` に eat/crash、難易度漸増、モバイル十字、軽量化）＋再確認
### よけよけランナー（2本目・第1弾推奨）
- [ ] GR-A `lib/games/runner.ts`＋テスト
- [ ] GR-B `games/RunnerGame.tsx`
- [ ] GR-C コイン/報酬連携＋ブラウザ3回確認
- [ ] GR-D 仕上げ＋再確認
### （以降ループで追加）もぐらたたき / ブロック崩し / おちものよけ / 神経衰弱 / めいろ
- [ ] 各ゲーム: GAMES.md に1エントリ追記 → ここに周A〜Dの4タスクを積む（定型）

## 仕上げ
- [ ] Z1 全体回帰: `npm run lint && npm run build`、`npm test`、`cd api && npm run build` 緑。
      `npm run swa:all` で 完走→コイン増→ショップ購入→着せ替え→各ゲーム の導線確認
- [ ] Z2 `PLAYBOOK.md` の罠を `LOOP_PROMPT.md` の検証チェックに昇格、ドキュメント最終化
