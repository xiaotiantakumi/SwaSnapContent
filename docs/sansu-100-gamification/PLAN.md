# PLAN — 機能仕様（ループが参照する設計の正）

100マス計算アプリに「コイン経済 ＋ アバターショップ ＋ 複数アーケードゲーム」を足す。
オフライン優先(localStorage) ＋ Azure Functions(Table Storage) の既存構成を厳密同期で拡張する。

## 既存アーキテクチャ（前提・調査確定）
- サーバーは **Azure Table Storage**（`SansuUsers`/`SansuSessions`）。配列/objは JSON文字列カラムで保持し
  `toPublic()` でパース。接続は `api/src/shared/tableClient.ts`、型は `api/src/shared/sansuTypes.ts`。
- セッション保存 `api/src/functions/sansuSessions.ts`（`sansuSessionsPost`）がサーバー側でユーザー集計を再計算し
  `updateEntity(Merge)`。API は `authLevel:'anonymous'`（子ども端末は PIN のみ、サーバー認証なし）。
- **既知の冪等バグ**: `createEntity` の 409 を握りつぶした後も集計加算が走る → 再送で二重加算。コインで顕在化するため C4 で修正。
- `submitSession` の戻り値は現状 `{ ok: true }` のみ（user を返さない）→ C5 で `{ ok, user }` 化。
- クライアント統合点 `app/sansu-100/lib/session-result.ts` の `finishSession()`（純粋関数）。既存 `calculatePoints()`（`lib/badges.ts`）の隣に `calculateCoins()`。
- localStorage層 `lib/storage.ts`（`safeGet/safeSet`、KEY `sansu-100:<entity>`、`upsertUser`、pending-sync）、
  同期 `hooks/useSansuSync.ts`、ユーザー状態 `hooks/useSansuUser.ts`（`updateUser`/`saveUser`）、API `lib/api-client.ts`（BASE `/api/sansu`）。
- アバター `lib/avatar.ts`（`AVATARS`絵文字24, `THEME_COLORS`, `THEME_COLOR_CLASSES`, `getThemeClasses`）。
- バッジ `lib/badge-catalog.ts`（`BadgeDef`/`TIER_COLORS`）＋ `lib/badges.ts`（`RULES`/`evaluateBadges`）。
  解放演出 `components/BadgeUnlockOverlay.tsx`（confetti+fanfare）＝ ミニゲーム報酬に再利用。
- 効果音 `lib/sound-presets.ts`。関数登録 `api/src/index.ts`。テストは client vitest（`lib/__tests__/`）、**API側はテスト基盤なし**。
- 型の正は2か所（`app/.../types.ts` と `api/.../sansuTypes.ts`）。両方を同期して拡張する。

## コイン経済
- **既存ポイントとは別通貨**: `totalPoints`=減らない累計スコア / `coins`=増減する残高。
- 貯め方: 1日1回目クリア+50 / 2回目以降+10 / 自己ベスト更新+20 / ストリーク到達3日+10・7日+30 / **1日上限150** / 減点・没収なし。
- 当日判定に `dailyCoinDate`(YYYY-MM-DD)/`dailyCoinsEarned`/`dailySessionCount` を持ち、日付が変わったらリセット。
- `calculateCoins` は `app/sansu-100/lib/coins.ts` と `api/src/shared/coins.ts` に**同一ロジック複製**。クライアントは楽観表示、サーバーが確定値。

## サーバー厳密同期＋不正対策（設計の核）
- API匿名＋PINのみ → 残高をクライアント申告で信じない。
- **獲得**: `sansuSessionsPost` でサーバー `calculateCoins` 再計算して加算。応答 `{ ok, user }` でクライアント上書き同期。
- **消費（参加費/購入）**: 専用エンドポイントでサーバーが残高 >= 必要額を検証。不足は409。価格はサーバー側カタログを正とし、
  クライアントは itemId/reason だけ送る（指名買い）。`getEntity→検証→updateEntity(Merge)`、ETag412は1回リトライ。
- **装備変更**: コイン増減なし、所持チェックのみ。
- **冪等**: `createEntity` 成功時だけ集計・加算（再送二重付与を防ぐ）。
- 全書込API応答の `user` で `saveUser`。ホーム表示時 `getUser` で残高再フェッチしズレ吸収。

## データモデル拡張（types.ts / sansuTypes.ts 両方、全optional）
```ts
coins?: number;
ownedItems?: string[];            // Entity: ownedItemsJson
equippedItems?: EquippedItems;    // Entity: equippedItemsJson
dailyCoinDate?: string;
dailyCoinsEarned?: number;
dailySessionCount?: number;
minigameHighScore?: number;
export type ItemSlot = 'hat' | 'background' | 'frame' | 'effect';
export type EquippedItems = Partial<Record<ItemSlot, string>>;
```
`toPublic()` でデフォルト付与（`coins: e.coins ?? 0`、`ownedItems: parse(e.ownedItemsJson ?? '[]')` 等）。

## アバターショップ
- **ガチャ排除・指名買い**。`ITEM_PRICES = { normal:50, rare:200, epic:1000 }`。
- アイテム: 帽子(王冠/ネコミミ/忍者鉢巻)・背景(宇宙/お城/海底/黒板)・フレーム(金枠/炎/水玉)・クリアエフェクト(紙吹雪/桜/花火)。
- `ShopItemDef{ id, slot, name, icon, rarity, price, render }`。`render` は emojiOverlay / bgClass / frameClass / effectClass。
- 着せ替え描画は `components/AvatarDisplay.tsx` で 背景→フレーム→絵文字→帽子→エフェクト を重ねる。既存絵文字直書きを置換。

## ミニゲーム（複数・GAMES.md にカタログ）
- 共通土台 `lib/minigame-core.ts`（rAF固定ステップ/入力/スコア/描画）に各ゲームを乗せる。Canvas2D。状態は useRef。
- **コインを使って遊ぶ**（参加費/コンティニュー）。**報酬は限定バッジ/称号**（コインを稼がせない＝経済崩壊防止）。
- 参加費 `POST /api/sansu/spend`、報酬 `POST /api/sansu/award-badge`。最高スコアは `minigameHighScore` 同期。演出は `BadgeUnlockOverlay` 再利用。
- spend/purchase はオンライン必須（残高検証が要る）。未接続は「いまは つながってないよ」で操作不可。

## 子ども向け配慮（共通）
ガチャ/ルートボックス排除・ペナルティ/没収なし・🪙等アイコンで文字が読めなくても分かる・ふりがな。
