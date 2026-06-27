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
- コミット: （この周で記録）
