# PLAYBOOK — 罠と対策（再発防止ノウハウ）

ループ中に踏んだ罠・気づきをここに1項目ずつ溜める。汎用的に効くものは `LOOP_PROMPT.md` の
検証チェックリストに昇格させる（Z2 タスク）。

形式:
```
## [カテゴリ] 一行タイトル
- 症状:
- 原因:
- 対策:
```

---

## [build] 開発サーバーと static export の競合
- 症状: `npm run dev` で `Cannot find module 'out/server/middleware-manifest.json'`。
- 原因: `output: 'export'`/`distDir: 'out'` が dev でも効くと衝突する。
- 対策: `next.config.mjs` は production のときだけ export 設定を適用済み（CLAUDE.md 参照）。dev で出たら設定退行を疑う。

## [型] 型定義が2か所にある
- 症状: クライアントだけ型を足してサーバービルドが通らない/同期ズレ。
- 原因: 型の正が `app/sansu-100/lib/types.ts` と `api/src/shared/sansuTypes.ts` の**2か所**。
- 対策: フィールド追加は必ず両方。Entity 側は JSON文字列カラム（`ownedItemsJson` 等）＋ `toPublic` でパース＆デフォルト。

## [コイン] ロジック複製のドリフト
- 症状: クライアント表示とサーバー確定値がズレる。
- 原因: `lib/coins.ts`（client）と `api/src/shared/coins.ts`（server）が別ファイルで複製のため。
- 対策: 同一の入出力でテスト（client側 `coins.test.ts`）。片方を直したら必ずもう片方も直す。サーバーが確定値。

## [API] 再送による二重加算（既存バグ）
- 症状: 同一セッション再送でポイント/コインが二重に増える。
- 原因: `sansuSessionsPost` が `createEntity` の409を握りつぶした後も集計加算を実行する。
- 対策: createEntity が**成功したときだけ**集計・コイン加算する（C4 で修正）。409 は skip。

## [テスト] 単体テストは個別実行が速い
- 症状: `npm test`（=`vitest run`）は全テストを走らせるため、1ファイル確認に時間がかかる。
- 対策: 開発中は `npx vitest run app/sansu-100/lib/__tests__/<file>.test.ts` で対象だけ実行。コミット前に一度 `npm test` で全件確認。

## [検証] ゲームは1回の確認では足りない
- 症状: たまにしか出ない不具合（食べ物が壁に出る/再開でスコアが残る等）を見逃す。
- 原因: 1回プレイだと再現しない。
- 対策: **同じゲームを最低3回プレイ**して確認（LOOP_PROMPT step4）。境界（開始直後/ゲームオーバー/再開）を重点的に。
