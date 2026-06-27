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
- [x] C1 型拡張: `app/sansu-100/lib/types.ts` と `api/src/shared/sansuTypes.ts` に
      `coins/ownedItems/equippedItems/dailyCoinDate/dailyCoinsEarned/dailySessionCount/minigameHighScore`（全optional）、
      `ItemSlot`/`EquippedItems` 型、`toPublic` にデフォルト付与（`coins: e.coins ?? 0` 等）
      受入: build緑、既存ユーザー（新カラム無し）が壊れない
      → 完了(周2): 両型に追加、Entityは ownedItemsJson/equippedItemsJson のJSON列。toPublicでデフォルト。frontend/api build緑、test76件緑
- [x] C2 `app/sansu-100/lib/coins.ts` ＋ `api/src/shared/coins.ts`（同一ロジック複製）:
      `calculateCoins(ctx)` = 1日1回目+50/以降+10/ベスト更新+20/ストリーク到達3日+10・7日+30/**1日上限150**/減点没収なし/日付跨ぎでリセット。
      ＋ `app/sansu-100/lib/__tests__/coins.test.ts`
      受入: `npm test` 緑。上限・日付跨ぎ・リタイヤ0・常に>=0 を網羅
      → 完了(周3): client/server同一ロジック複製。テスト9件（上限・日付跨ぎ・ストリーク到達日・リタイヤ・>=0）緑。test計85件
- [x] C3 `app/sansu-100/lib/session-result.ts` の `finishSession` に `calculateCoins` 統合。
      `FinishSessionResult` に `coinsEarned` と `coinBreakdown`（表示用）を追加。daily系3フィールドを更新
      受入: 既存 `session-result.test.ts` 緑 ＋ コイン反映の新テスト
      → 完了(周4): isNewBest を明示算出、coin統合。coinsEarned/coinBreakdown返却、coins/daily系をupdatedUserに反映。test88件緑
- [x] C4 `api/src/functions/sansuSessions.ts`: サーバー `calculateCoins` 統合で `coins` 加算、
      **冪等バグ修正**（`createEntity` 成功時のみ集計・コイン加算。409 は skip）、レスポンスを `{ ok, user: toPublic(...) }` に
      受入: `cd api && npm run build` 緑。同一セッション再送で二重加算しない（手動確認 or ロジックレビュー）
      → 完了(周5): created フラグで集計を新規時のみ実行（冪等修正）。実用厳密=base/best/上限はサーバー再計算、streakは
        body.streakDays/prevStreakDays 申告許容。再送は無変更でuser返却。応答 {ok,user}。api build緑。e2e検証はZ1へ
- [x] C5 `app/sansu-100/lib/api-client.ts`: `submitSession` 戻り値を `{ ok; user? }` 化、`getUser` で残高再同期。
      `app/sansu-100/play/page.tsx`: 送信応答の `user` で `saveUser`（残高をサーバー値に確定）
      受入: build緑。完走後ローカル残高がサーバー値に一致
      → 完了(周6): submitSession に streak文脈付き・戻り値{ok,user}。play/page で完走/リタイヤ両方 onServerSync(saveUser)で確定同期。
        getUser は既存。build/test88緑。視覚確認はC6（残高表示）でまとめて実施
- [x] C6 `app/sansu-100/components/CoinBalance.tsx`（🪙＋数値、増加アニメ）。`result/page.tsx` に獲得breakdown、
      `page.tsx`（ホーム）に残高表示
      受入: 完走でコイン増/上限150で頭打ち/リロードでサーバー値一致/リタイヤで増えない をブラウザ確認
      → 完了(周7): CoinBalance/result coin card/home pill 実装。ライブAPI検証(azurite): 1回目perfect=70/同id再送=70(冪等)/
        2回目=80/非perfect=50/retire据置/getUser一致。UI もブラウザで描画確認(home🪙240, result+70/内訳)。**第1弾コイン経済 完了**

## 第2弾 ショップ＋着せ替え
- [x] S1 `app/sansu-100/lib/shop-catalog.ts`（`ShopItemDef`/`SHOP_CATALOG`/`ITEM_PRICES{normal:50,rare:200,epic:1000}`、
      帽子/背景/フレーム/エフェクト）＋ `api/src/shared/shopCatalog.ts`（価格/スロットのみ複製）＋ `shop-catalog.test.ts`
      受入: `npm test` 緑。price=ITEM_PRICES[rarity] 整合、id重複なし
      → 完了(周8): 17アイテム(hat5/bg5/frame4/effect3)。render種別=emojiOverlay/bgClass/frameClass/effectClass。
        Tailwindは完全文字列で記述しパージ回避。server shopCatalog.ts に価格/スロット複製。test6件、計94件緑
- [x] S2 `app/sansu-100/components/AvatarDisplay.tsx`（背景→フレーム→絵文字→帽子→エフェクトを重ね描画）。
      既存の絵文字直書き（`page.tsx`/`components/UserTile.tsx`/`result/page.tsx`）を置換
      受入: 未装備ユーザーは従来見た目、装備で重なる をブラウザ確認
      → 完了(周9): AvatarDisplay 実装、UserTile/ホームを置換(resultは絵文字非表示なので対象外)。host Playwrightで検証=
        未装備は従来通り/装備(冠+宇宙背景+金枠)が重なる をスクショ確認、console error 0。build/test94緑
- [x] S3 `api/src/functions/sansuPurchase.ts`（購入=残高検証+減算+ownedItems追加 / equip=装備変更）＋
      `api/src/index.ts` 登録 ＋ `api-client.ts` に `purchase`/`equip`
      受入: `cd api && npm run build` 緑。残高不足で409、価格はサーバーが引く
      → 完了(周10): buy/equip/unequip を1エンドポイントに。価格はSHOP_PRICES(サーバー正)。ライブ検証(azurite)=
        buy減算/不足409/equip装備/未所持equip409/再購入は二重課金なし/unequip解除。api build/test94緑
- [x] S4 `app/sansu-100/shop/page.tsx` ＋ `closet/page.tsx`（タブ統合可）＋ ホーム導線
      受入: 購入で残高減・所持追加・装備反映、不足で買えない、リロード維持 をブラウザ確認
      → 完了(周11): shop に購入＋着せ替えを統合（closet別ページは作らずタブ統合）。ホームに🛍️おみせ導線。
        host Playwright end-to-end: 70→buy=20/avatarに帽子反映/つけてる✓/不足アイテムdisabled。console error0。**第2弾完了**

## 第3弾 ミニゲーム基盤＋報酬
- [x] G0 `api/src/functions/sansuSpend.ts`（参加費/コンティニュー=残高検証+減算）＋
      `api/src/functions/sansuAwardBadge.ts`（earnedBadges追加のみ・経済影響ゼロ）＋ `index.ts` 登録 ＋ `api-client.ts` に `spend`/`awardBadge`
      受入: `cd api && npm run build` 緑。残高不足で開始不可（409）
      → 完了(周12): spend(play10/continue15、コストはサーバーSPEND_COSTS正)＋award-badge(バッジ＋最高スコア、コイン不変)。
        ライブ検証=play70→60/continue→45/不正reason400/award後coins不変・high更新/lowスコアは据置/枯渇で409。api build/test94緑
- [x] G0b `app/sansu-100/lib/minigame-rewards.ts`（スコア→限定バッジ判定）＋ `badge-catalog.ts` に `category:'minigame'` 称号追加 ＋
      `app/sansu-100/minigame/page.tsx`（ハブ: ゲーム選択・参加費表示・結果演出は `BadgeUnlockOverlay` 再利用）
      受入: build緑。ハブからゲームに入れる、報酬演出が出る
      → 完了(周13): minigame category＋snake/runner称号4種、BadgeShowcaseにラベル。evaluateMinigameBadges＋テスト3件。
        minigame-list レジストリ。ハブ画面（残高・参加費・ゲーム一覧、available=falseはじゅんびちゅう）。ホームに🎮ゲーム導線。
        computer-use実機確認: ハブ描画・残高60・両ゲームじゅんびちゅう表示OK。test97緑

## 第4弾 ゲーム本体（1ゲーム=周A〜D。GAMES.md 参照）
### スネーク（基準実装）
- [x] GS-A `lib/games/snake.ts`（衝突/成長/food配置/score、純粋関数）＋ `__tests__/snake.test.ts` → 完了(周14): 7テスト緑（成長/壁/自己衝突/反転無視/food配置）
- [x] GS-B `games/SnakeGame.tsx`（minigame-core に乗せて Canvas+操作）→ 完了(周15): Canvas2D+rAF固定ステップ、useRef状態、キーボード＋十字ボタン
- [x] GS-C コイン消費＋報酬連携＋ブラウザ動作確認 → 完了(周15): minigame/snake/page で参加費spend→play→over→award-badge→Overlay。
      host Playwrightで描画/操作/console0、Chrome MCPで実機 fee 60→50、computer-useで実機イントロ描画を確認
- [x] GS-D 仕上げ → 完了(周16): sound-presets に eat/crash 追加し soundOn 尊重で SnakeGame に配線。難易度漸増/モバイル十字は GS-B 済。
      host Playwright 回帰: ゲームオーバー到達・console error 0。**スネーク完成**
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
