---
name: minigame-bot-verify
description: sansu-100 のミニゲーム(app/sansu-100/games/*)について、難易度・バランス・「もっと〇〇して」「理不尽に難しい/簡単」「詰む」等の挙動に関する質問や修正依頼を受けたときに使う。botシミュレーション（scripts/balance/ 配下、ゲームロジックをNode上で直接叩いてbotに大量試行させる仕組み）による実データ検証が必要かどうかを先に判定し、要不要と分析結果に応じて回答・実装を進める手順を定める。UI文言修正・見た目だけの変更・単発バグで難易度に関係ないものには適用しない。
---

# Minigame Bot Verify

## Overview

sansu-100 のミニゲームに関する質問・要望を受けたら、まず「これは難易度/バランスに関わる話か」を判定し、
関わるなら**推測で答えず、botシミュレーションを実際に実行してから**回答する。既存の仕組みは
`scripts/balance/` 以下にゲームごとの headless シミュレーションスクリプトとして置かれる想定
（パイロットは `pakupaku-sim.ts`、ロジックは `app/sansu-100/games/logic/*-logic.ts` に抽出済み）。

## Step 1: 判定（bot検証が要るか）

質問・要望を次のどちらかに分類する。

**bot検証が必要（難易度/バランス系）**
- 「難しすぎる/簡単すぎる」「詰む」「理不尽」「ゴーストが速すぎ」等の体感バランスの指摘
- スコアの伸び方・クリア率・平均生存時間など、実際にプレイしないと分からない定量的な問い
- 難易度パラメータ(速度・出現間隔・判定ウィンドウ等)の変更提案とその影響評価
- 「このパラメータを変えたらどうなる？」という仮定の検証

**bot検証が不要（そのまま回答/実装してよい）**
- UI文言、見た目(色・レイアウト)、アクセシビリティ、コード整理などバランスに影響しない変更
- 明確な単発バグ（例外・クラッシュ・誤字）で、難易度への影響がない修正
- エンジン選定やアーキテクチャなど、本スキルとは別の技術判断の相談

判断に迷う場合は「bot検証が必要」側に倒す（過小評価より過剰検証の方が安全）。

## Step 2: 対象ゲームに検証ハーネスがあるか確認

```bash
ls scripts/balance/ 2>/dev/null
ls app/sansu-100/games/logic/ 2>/dev/null
```

- **既にある**（例: pakupaku）→ Step 3 へ。
- **まだ無い**→ ユーザーに一言断った上で選択させる:
  (a) まずそのゲームのロジックを抽出してハーネスを新規実装してから検証する
  (b) ハーネス無しで、コードを読んだ推測ベースの回答であることを明記して先に答える
  無言で推測回答だけをして「検証済み」であるかのように話さないこと。

## Step 3: シミュレーションを実行し、実データを見てから回答する

- 対象の `npm run balance:<game>` 相当のスクリプトを実際に実行する（`Bash`ツール）。
- 修正提案をするときは、**変更前**の分布（平均スコア・生存tick数・死因内訳など）と、
  **変更後**の分布を両方実際に走らせて比較する。「たぶん改善するはず」ではなく数値で示す。
- 出力が無い/エラーになる場合は、ハーネス側の不具合の可能性があるので先にそれを直す
  （推測で難易度の話を進めない）。

## Step 4: 実装が必要な場合の振り分け

- ハーネスの新規実装・ロジック抽出・複数ファイルにまたがる変更 → `ai-mix` skill の方針に従い
  `cursor-implementer` サブエージェントへ委譲し、diffは自分でレビューしてから動作確認する。
- 既存ハーネスのパラメータ変更程度の小さい修正 → 直接編集してよい（Cursorに投げるほどではない）。
- 大規模な追加調査・複数候補比較などが要る場合は、別途 Opus のサブオーケストレーターを
  立てるかどうかをユーザーに確認する（このスキル自体はその判断を強制しない）。

## 既知の対応状況（都度更新）

**対応済み（14ゲーム）**。各 `npm run balance:<game>` で headless bot シミュレーションが走る。
戦略は最低2種（ランダム系＋ヒューリスティック系）、mulberry32 のシード付き乱数で再現性あり、
ゲーム用randとbot意思決定用randは別インスタンス。集計は console.table（avgScore/median/p25/p75/
min/max/avgTicks/overRate 等）。

- ロジックが `app/sansu-100/games/logic/<game>-logic.ts` に抽出済み（コンポーネントからも import。純粋リファクタで挙動不変）:
  - **pakupaku** (`balance:pakupaku`, bot: random / greedy)
  - **airhockey** (`balance:airhockey`, random / tracker)
  - **starshooter** (`balance:starshooter`, random / tracker)
  - **ponpon** (`balance:ponpon`, random / tracker)
  - **kurukurin** (`balance:kurukurin`, random / pathfinder〈迷路BFS〉)
  - **rhythmdon** (`balance:rhythmdon`, perfect / human〈タイミング誤差σ〉)
    ※ config化(spawn間隔・hit window・duration)済みで、判定ウィンドウを変えたときのhitRate分布を検証可能。
- ロジックが元々 `app/sansu-100/lib/games/<game>.ts` に純粋関数で存在し、sim（`scripts/balance/<game>-sim.ts`）
  のみ追加（コンポーネント変更なし）:
  - **flappy** (random / heuristic)
  - **snake** (random / greedy)
  - **runner** (random / heuristic)
  - **falling** (random / heuristic)
  - **breakout** (random / tracker ※乱数なし決定論、多様性はbot側乱数で作る)
  - **whack** (random / smart)
  - **maze** (random / solver〈BFS〉 ※ターン制。時間モデル MOVE_MS=400ms を仮定して制限時間内クリア数を集計)
  - **memory** (random / memory〈完璧記憶〉 ※PAIR_MS=1500ms を仮定。強い戦略は MAX_LEVEL=50 で頭打ちになる点に注意)

**見送り（3ゲーム）**——tick駆動の自律進行が無く「入力に反応するだけ」で、mass-trial bot シミュレーション
の費用対効果が低い（難易度は主にレベル定義/制限時間の調整であり、botで回しても分布が生まれにくい）。
必要なら Playwright 越しの DOM 状態読み取り bot が本来の候補（Step 2 で「ハーネス無し」判定になる）:
- **OboeteTouchGame**: サイモンセイズ型。状態が点灯演出のタイミングと密結合。botは正解列を再現するだけで試行の多様性が無い。
- **HitofudeLineGame**: 一筆書きソルバー型。乱数もリアルタイム進行も無く（完全決定論）、大量試行の意味が薄い（ロジック自体は純粋で抽出は容易）。
- **SwipeSortGame**: 偶奇仕分けの入力反応型。botは常に正解でき、シミュレーションの多様性が生まれない。

補足: 難易度パラメータを変えて比較する場合は、対象 sim の config/定数を書き換えて before/after を両方
実際に走らせ、数値で示すこと（Step 3）。lib/games 側のロジックを直接変更すると本番挙動も変わるので、
「本番挙動を変えずに sim だけで試したい」場合は sim スクリプト内でパラメータを上書きする形にする。
