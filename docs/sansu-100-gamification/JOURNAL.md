# JOURNAL — 周ごとの作業ログ（追記専用）

各周はこのテンプレで追記する:

```
## 周 N — <タスクID> <一行タイトル>  (loop-version: vX)
- やったこと:
- 検証: lint/build/test の結果。ゲームなら「3回プレイ確認」の結果（クラッシュ/操作/コイン消費/軽さ）
- 学び/罠: （あれば PLAYBOOK.md にも転記）
- 残課題 / 次にやること:
- コミット: <hash or なし>
```

LOOP_PROMPT を改善した周は次も残す:
```
- prompt改善: vX→vX+1 — 何をなぜ変えたか
```

---

## 周 0 — B0-1 ループ基盤の構築  (loop-version: v1)
- やったこと: 作業ブランチ `feat/sansu-100-gamification` を作成。`docs/sansu-100-gamification/` に
  LOOP_PROMPT.md / BACKLOG.md / PLAN.md / GAMES.md / JOURNAL.md / PLAYBOOK.md の6ファイルを作成。
  `/loop docs/sansu-100-gamification/LOOP_PROMPT.md を実行` で自走できる状態にした。
- 検証: ドキュメントのみのため lint/build は対象外。6ファイルの存在と相互参照を確認。
- 学び/罠: なし（初期セットアップ）。
- 残課題 / 次にやること: B0-2 `minigame-core.ts` から実装を開始（次周）。
- コミット: f5a049d

## 周 1 — B0-2 minigame-core.ts（共通土台）  (loop-version: v1)
- やったこと: `app/sansu-100/lib/minigame-core.ts` を作成。固定タイムステップの `advance()`、方向まわり
  （`nextDirection`/`isOpposite`/`DIR_VECTORS`、180度反転無視）、入力マッピング（矢印/WASD/アクションキー）、
  難易度カーブ `tickIntervalForScore`、Canvas ヘルパ（`setupCanvas`/`drawCell` 等）、rAF駆動 `startGameLoop`。
  純粋部分とCanvas/rAFを分離。`__tests__/minigame-core.test.ts` を追加。
- 検証: `npx vitest run minigame-core.test.ts` → 11件緑。`npm run lint` 既存警告のみ（新規ファイル指摘なし）。`npm run build` 成功。
- 学び/罠: 単体テストは `npx vitest run <path>` が速い（`npm test` は全件走る）→ PLAYBOOK に追記。
- 残課題 / 次にやること: C1 型拡張（types.ts / sansuTypes.ts に coins 等を追加、toPublicデフォルト）。
- prompt改善: なし（v1のまま。摩擦は軽微）。
- コミット: 29f43d9

## 周 2 — C1 型拡張（coins/owned/equipped/daily系）  (loop-version: v1)
- やったこと: `app/sansu-100/lib/types.ts` と `api/src/shared/sansuTypes.ts` に coins/ownedItems/equippedItems/
  daily系/minigameHighScore（全optional）と `ItemSlot`/`EquippedItems` を追加。Entity は ownedItemsJson/
  equippedItemsJson のJSON文字列カラム。`toPublic` でデフォルト（`?? 0`/`[]`/`{}`）付与し後方互換を確保。
- 検証: `npm run build`（frontend）緑、`cd api && npm run build` 緑、`npm test` 76件緑。挙動変更なしの純粋な型拡張。
- 学び/罠: なし。
- 残課題 / 次にやること: C2 `coins.ts`＋`api/src/shared/coins.ts`（calculateCoins）＋テスト。
- prompt改善: なし。
- コミット: bae4487

## 周 3 — C2 calculateCoins（コイン計算の核）  (loop-version: v1)
- やったこと: `app/sansu-100/lib/coins.ts` と `api/src/shared/coins.ts` を同一ロジックで作成。
  COIN_RULES（1回目50/以降10/ベスト20/3日10/7日30/上限150）、`calculateCoins(ctx)` は当日カウンタの
  日付跨ぎリセット・上限クリップ（減点なし＝常に>=0）・breakdown表示・反映後の当日カウンタを返す。
  `__tests__/coins.test.ts` で9ケース網羅。
- 検証: coins.test 9件緑、`cd api && npm run build` 緑、`npm run build`(frontend)緑、`npm test` 85件緑、lint指摘なし。
- 学び/罠: なし（複製ドリフトは PLAYBOOK 既出。両ファイル同時更新を徹底）。
- 残課題 / 次にやること: C3 `finishSession` に統合（isNewBest 判定・coinsEarned/breakdown・daily系更新）。
- prompt改善: なし。
- コミット: f73719e

## 周 4 — C3 finishSession にコイン統合  (loop-version: v1)
- やったこと: `session-result.ts` で `isNewBest` を明示算出し `calculateCoins` を呼ぶよう統合。
  `FinishSessionResult` に `coinsEarned`/`coinBreakdown` を追加、`updatedUser` に coins加算＋daily系3フィールド反映。
  `session-result.test.ts` にコイン3ケース追加（獲得/既存加算/リタイヤ0）。
- 検証: session-result.test 7件緑、`npm test` 88件緑、`npm run build` 緑。
- 学び/罠: なし。
- 残課題 / 次にやること: C4 サーバー `sansuSessions.ts`（サーバーcalculateCoins統合＋冪等修正＋応答user）。
- prompt改善: なし。
- コミット: 888f600

## 周 5 — C4 サーバーコイン統合＋冪等修正  (loop-version: v1)
- やったこと: `sansuSessionsPost` を再構成。`created` フラグを導入し、ユーザー集計・コイン加算を
  **新規作成成功時のみ**実行（再送409では現在のuserを無変更で返す＝二重加算バグ修正）。サーバー calculateCoins を
  「実用厳密」で統合（base/best/上限はサーバー再計算、streakは body.streakDays/prevStreakDays 申告許容）。
  応答を `{ ok, user: toPublic(refreshed) }` 化。`SubmitSessionBody` 型で isRetired/streak を受ける。
- 検証: `cd api && npm run build` 緑（isRetired 型エラーを1件修正）。冪等修正はロジックレビューで確認（集計は created 時のみ）。
  Table Storage e2e は azurite 環境が要るため Z1 回帰でまとめて確認。
- 学び/罠: サーバーの SansuSession 型には isRetired が無い→SubmitSessionBody 側で受ける必要があった。
- 残課題 / 次にやること: C5 `api-client.ts`（submitSession 戻り値 {ok,user}＋streak送信＋getUser）、play/page で saveUser。
- prompt改善: なし。
- コミット: f2ee036

## 周 6 — C5 api-client 戻り値とサーバー残高同期  (loop-version: v1)
- やったこと: `api-client.submitSession` を `(session, ctx?)` 化し streakDays/prevStreakDays を送信、戻り値を
  `{ ok; user? }` に。`play/page.tsx` に `onServerSync`(=saveUser) プロップを追加し、完走/リタイヤ両方で
  サーバー応答 user によりローカル残高を確定上書き同期。getUser は既存利用。
- 検証: `npm run build` 緑、`npm test` 88件緑。lint: 新規 warning 1件（promise/always-return、fire-and-forget の
  then。build は通る＝既存ファイルも warning 多数のため許容）。視覚確認は C6（残高表示）でまとめて実施予定。
- 学び/罠: 第1弾のコイン獲得→サーバー権威同期の配線が完了。残るは C6 の残高UI。
- 残課題 / 次にやること: C6 `CoinBalance.tsx` ＋ result/home 表示。ここで dev サーバー起動しブラウザ確認（完走でコイン増/上限/リロード一致/リタイヤ増えない）。
- prompt改善: なし。
- コミット: 9701583

## 周 7 — C6 コイン残高UI＋ライブ検証  (loop-version: v1→v2)
- やったこと: `components/CoinBalance.tsx`（🪙pill）、`result/page.tsx` にコイン獲得カード（内訳リスト＋残高、複雑度回避で
  CoinEarnedCard 抽出）、`page.tsx` ホームに残高pill。play/page の last-result に coinsEarned/coinBreakdown/coinsAfter 追加。
- 検証: build/test88緑、lint クリーン。**フルスタック(npm run sansu:dev)起動しライブ検証**:
  - API(curl/azurite): 1回目perfect=70(50+20)/同id再送=70(冪等OK)/2回目=80(+10)/非perfect1回目=50/retire=据置/getUser一致。
  - UI(Playwright MCP): ホーム🪙240 pill 描画、結果画面「+70ゲット」＋内訳(きょう1回目+50/ベストこうしん+20)＋残高310 描画。スクショ取得。
- 学び/罠: MCPブラウザは Docker→host.docker.internal(非セキュアorigin)で Web Crypto 無効=ユーザー作成不可。
  → サーバーは curl、UIは localStorage 注入(id は JSON.stringify)で検証する手順を確立。
- prompt改善: **v1→v2**: LOOP_PROMPT step4 にブラウザ検証の実証済みレシピを追記、PLAYBOOK に罠2件追加。
- 残課題 / 次にやること: **第1弾(コイン経済)完了**。次は第2弾 S1 `shop-catalog.ts`（ショップ・アイテム定義）。
- コミット: （この周で記録）

## 周 8 — S1 ショップ・アイテムカタログ  (loop-version: v2)
- やったこと: `lib/shop-catalog.ts`（17アイテム: hat5/bg5/frame4/effect3、ITEM_PRICES、ShopItemDef、render種別、
  SHOP_BY_ID/getItemDef/RARITY_LABEL）＋ `api/src/shared/shopCatalog.ts`（SHOP_PRICES 価格/スロット複製）＋ `shop-catalog.test.ts`(6件)。
  Tailwind クラスは完全文字列で記述しパージ回避。
- 検証: shop-catalog.test 6件緑、api build緑、frontend build緑、`npm test` 94件緑。
- 学び/罠: なし（複製は PLAYBOOK 既出。両ファイル同時更新）。
- 残課題 / 次にやること: S2 `AvatarDisplay.tsx`（装備重ね描画）＋既存の絵文字直書き置換。ここはブラウザ確認あり。
- prompt改善: なし。
- コミット: （この周で記録）

## 周 9 — S2 AvatarDisplay 着せ替え描画  (loop-version: v2→v3)
- やったこと: `components/AvatarDisplay.tsx`（背景→フレーム(ring)→絵文字(＋effectClass)→帽子overlay を重ね描画、
  未装備はテーマ色フォールバック）。`UserTile.tsx` とホーム `page.tsx` の絵文字直書きを AvatarDisplay に置換
  （result はアバター非表示のため対象外）。
- 検証: build/test94緑。**host Playwright で検証**: 未装備(🐼)=従来の見た目、フル装備(🦊+👑冠+宇宙背景+金枠+pulse)が
  正しく重なる をスクショ確認。console error 0件。
- 学び/罠: (1) dev 稼働中に `npm run build` すると dev .next 破壊→500（順序固定で回避）。(2) Docker MCP browser が
  EOF で落ちる→host Playwright(プロジェクト直下スクリプト, localhost セキュア)が安定。両方 PLAYBOOK 追記。
- prompt改善: **v2→v3**: UI検証の既定を host Playwright に変更、ビルドは dev 起動前に済ます旨を明記。
- 残課題 / 次にやること: S3 `sansuPurchase.ts`（購入=残高検証+減算+owned追加 / equip）＋index登録＋api-client。
- コミット: （この周で記録）

## 周 10 — S3 購入API (buy/equip/unequip)  (loop-version: v3)
- やったこと: `api/src/functions/sansuPurchase.ts`（POST /sansu/purchase、action=buy/equip/unequip。残高検証+減算+
  ownedItems追加 / 装備変更。価格は SHOP_PRICES がサーバー正）。`index.ts` 登録。`api-client.ts` に purchase()（409はerror返し）。
- 検証: api build緑、lint/clean、test94緑。**ライブ検証(azurite, curl)**: 70→buy hat_cap=20 / hat_crown(200)を20で=409不足 /
  equip→{hat:hat_cap} / 未所持bg_space equip=409 / 再buyは二重課金なし(20) / unequip=解除。全期待一致。
- 学び/罠: 新Functionは func 再起動しないとルート未登録(404)→stack再起動で反映。dev中はnext buildを避ける(v3)。
- 残課題 / 次にやること: S4 `shop/page.tsx`＋`closet/page.tsx`(タブ統合可)＋ホーム導線。host Playwrightで購入→装備反映を確認。
- prompt改善: なし。
- コミット: （この周で記録）

## 周 11 — S4 ショップ画面＋着せ替え＋導線  (loop-version: v3)
- やったこと: `app/sansu-100/shop/page.tsx`（残高・アバタープレビュー・スロット別アイテム一覧・購入/装備/解除ボタン・
  メッセージ。closet は別ページにせず統合）。ホーム `page.tsx` に「🛍️ おみせ」導線。
- 検証: lint clean、test94緑、shop ページ dev コンパイル200。**host Playwright end-to-end**: ユーザー作成→セッションで70コイン→
  shop で キャップ(50)購入→残高20→avatar プレビューに🧢反映→つけてる✓。不足アイテム(リボン50/おうかん200)は20コインで
  disabled=true を assert。console error 0。スクショ3枚取得（open/bought/equipped）。
- 学び/罠: なし（v3手順がそのまま機能）。
- 残課題 / 次にやること: **第2弾(ショップ)完了**。次は第3弾 G0 `sansuSpend.ts`＋`sansuAwardBadge.ts`（参加費/報酬API）。
- prompt改善: なし。
- コミット: （この周で記録）

## 周 11.5 — computer-use 実機動作確認（第1・2弾）  (loop-version: v3→v4)
- やったこと: ユーザー指示で computer-use により実機ブラウザで第2弾ショップを確認。Chrome MCP で localhost を開き
  funded user(けんちゃん, 110コイン)を注入→`open`で前面化→computer-use screenshot。さらに実DOMの買うボタンを
  javascript_tool で `.click()`→キャップ購入で 110→60、装備でアバターに🧢反映、つけてる✓ を実機スクショで確認。
- 検証: 実機表示OK。コード変更なし（既コミット分の動作確認）。
- 学び/罠: Chrome は computer-use read tier。drive=Chrome MCP / verify=computer-use に分担。`open`が別タブで stale 化→
  `?v=N`で開き直す。両方 PLAYBOOK 追記。
- prompt改善: **v3→v4**: 「各タスク末に computer-use 実機確認」をユーザー恒久指示として LOOP_PROMPT step4 に明記。
- 残課題 / 次にやること: 第3弾 G0（参加費/報酬API）。以降ゲームも実機スクショで描画・動作を目視確認する。
- コミット: （この周で記録）

## 周 12 — G0 参加費/報酬API  (loop-version: v4)
- やったこと: `api/src/shared/minigame.ts`（SPEND_COSTS: play10/continue15）、`sansuSpend.ts`（残高検証+減算、コストはサーバー正）、
  `sansuAwardBadge.ts`（earnedBadges追加＋minigameHighScore更新、コイン不変）、index.ts登録、api-client に spend()/awardBadge()。
- 検証: api build緑、lint clean、test94緑。ライブ(azurite,curl): play70→60/continue→45/不正reason400/award後coins不変・high=30/
  低スコアは据置/枯渇で409 insufficient。UIなしのため computer-use 確認は次の G0b/ゲームで実施。
- 学び/罠: なし。
- 残課題 / 次にやること: G0b `minigame-rewards.ts`＋badge-catalog に minigame称号＋`minigame/page.tsx`(ハブ)。UIなので computer-use 確認あり。
- prompt改善: なし。
- コミット: （この周で記録）
