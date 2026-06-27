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
- コミット: （このコミットで記録）
```
```
