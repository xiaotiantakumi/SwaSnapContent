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

## [検証] フルスタック起動とブラウザ検証の罠（実証済み）
- 症状: `npm run dev` だけだとユーザー作成（サーバー必須）ができず検証に入れない。また Playwright MCP で
  `host.docker.internal:4280` を開くと `crypto.randomUUID is not a function` / PIN 検証失敗でユーザーを作れない。
- 原因: (1) ユーザー作成/PIN は Azure Functions + ストレージが要る。(2) MCP ブラウザは Docker 内のため
  `localhost` ではなく `host.docker.internal` を使うが、この origin は非セキュアで Web Crypto（randomUUID/subtle）が無効。
- 対策:
  - フルスタックは `npm run sansu:dev`（azurite+API+swa+next、:4280）を background 起動。`curl :4280/sansu-100`=200 を待つ。停止は `npm run sansu:stop`。
  - **サーバーロジックは curl で API を直接検証**（最も確実・再現可能）。例: コインは `/api/sansu/sessions` POST の
    応答 `user.coins` を確認、同一 id 再送で二重加算しないこと（冪等）も確認。注意: zsh では `UID` は readonly なので別名を使う。
  - **UI は localStorage 注入**で表示。`sansu-100:current-user` は **`JSON.stringify('id')`**（生文字列だと getCurrentUserId の
    JSON.parse が失敗して null になる）、`sansu-100:users` は配列JSON、結果画面は `sessionStorage['sansu-100:last-result']`。
    `sansu-100:dev-seeded`='1' で API シードをスキップ。注入後リロードして snapshot/screenshot。

## [検証] dev サーバー稼働中に `npm run build` すると 500 になる
- 症状: `npm run sansu:dev`(next dev) 稼働中に `npm run build` を実行したら、以後 `/sansu-100` が 500
  （`Error: Cannot find module './586.js'` / MODULE_NOT_FOUND、`.next/server/...`）。
- 原因: production build が dev の `.next` チャンクキャッシュを上書き破壊する（dev と export 設定の競合）。
- 対策: **ブラウザ検証の順序を固定する** = 先に `lint→build→test` を全部済ませてから `sansu:dev` を起動し、
  dev 稼働中は production `build` を流さない。コード修正で再検証が要るときは dev のホットリロードに任せる
  （型確認だけしたいなら一旦 `sansu:stop` してから build）。壊れたら `sansu:stop && sansu:dev` で復旧。

## [検証] UI 検証は host Playwright が最も安定（Docker MCP より優先）
- 症状: Docker の Playwright MCP は接続が `EOF` で落ちることがあり、また host.docker.internal は非セキュアで
  Web Crypto 無効（ユーザー作成不可）。
- 対策: repo に入っている `@playwright/test` を **host で**使う。スクリプトを**プロジェクト直下**に置き
  （ESM は NODE_PATH 無効＝node_modules 解決のため直下必須）、`import { chromium } from '@playwright/test'`、
  `localStorage` 注入→reload→`page.screenshot()`。実行後スクリプトは削除（repo を汚さない）。`localhost:4280` は
  セキュアコンテキストなので crypto も使える。`page.on('console'|'pageerror')` でエラー0件を確認すること。

## [検証] computer-use 実機確認（ユーザー恒久指示）
- 要点: ユーザーは「各タスクを computer-use で実機の最低限動作確認」を求めている。Chrome は computer-use では
  read tier（クリック/入力不可）なので、driveは Claude-in-Chrome MCP、verifyは computer-use screenshot に分担する。
- 手順: (1) Chrome MCP `navigate` で localhost:4280 → `javascript_tool` で funded user を localStorage 注入（API でユーザー作成＋
  セッションでコイン付与→getUser→localStorage、id は JSON.stringify）。(2) `open -a "Google Chrome" URL` で前面化。
  (3) `mcp__computer-use__screenshot` で確認。(4) ボタン操作は javascript_tool で実DOMの `.click()`（act() 実ハンドラを通る）。
- 罠: `open` は別タブを作り stale React state を表示することがある→更新後は `?v=N` のキャッシュバスターURLで開き直すと
  最新 localStorage を読んだ新タブが前面に出る。MCPタブと open タブは別グループになりうる点に注意。

## [検証] ゲーム(rAF)は background タブで止まる→実機の「動く」確認の分担
- 症状: Canvas ゲームを MCP タブで start しても score が進まず playing のまま。computer-use で前面化しても
  別タブ/別ウィンドウが出て動かない。
- 原因: Chrome は **非表示タブの requestAnimationFrame を停止/間引き**する。MCP タブはたいてい背面なので rAF が止まる。
  加えて MCP タブと `open` の前面タブは別で、ゲームの "playing" 状態はメモリ（localStorage 非永続）なので前面タブに映らない。
- 対策（分担）: (1) ゲームの**描画・動き・スコア・コイン消費**は **host Playwright** で確認（自前ブラウザ＝前面扱いで rAF が動く。
  start→キー操作→canvas screenshot→console error 0）。(2) computer-use では**実機でゲームUI（イントロ/ハブ）が描画される**ことを
  確認すれば最低限OK（参加費が引かれるのは Chrome MCP js で `[aria-label^=コイン]` を読めば確認できる）。
  ゲームのロジックは純粋関数のユニットテストで担保する。

## [SWA] 実環境のホスト判定は x-forwarded-host 単独に頼らない
- 症状: ローカル swa-cli では `x-forwarded-host` でデバッグ判定が通るのに、実 SWA だと 403 になる。
- 原因: 実 SWA の Functions が受け取る `x-forwarded-host` は内部ホスト等で期待値と違うことがある。`a ?? b` だと
  a が非nullの内部ホストを返し b(host) に落ちない。
- 対策: `host / x-forwarded-host / x-original-host / referer` を候補にして `.some(isDebugHost)` で判定する。
  ドメイン依存の分岐は**実 SWA で必ず確認**（ローカル swa-cli と挙動が違う）。本番は -<番号>.azurestaticapps に一致せず 403 のまま。

## [検証] ゲームは1回の確認では足りない
- 症状: たまにしか出ない不具合（食べ物が壁に出る/再開でスコアが残る等）を見逃す。
- 原因: 1回プレイだと再現しない。
- 対策: **同じゲームを最低3回プレイ**して確認（LOOP_PROMPT step4）。境界（開始直後/ゲームオーバー/再開）を重点的に。
