---
description: SwaSnapContent プロジェクトの包括的な説明と開発ガイド
alwaysApply: false
---

# SwaSnapContent プロジェクト概要

## プロジェクトの目的

SwaSnapContentは、ウェブコンテンツを効率的に収集・抽出・管理するための統合PWA（Progressive Web App）アプリケーションです。Azure Static Web Apps上で動作し、3つの主要機能を提供します。

## 主要機能

### 1. URL本文抽出（URL Extractor）

- **パス**: `/url-extractor`
- **機能**: 入力されたURLからウェブページの本文を抽出し、読みやすく表示
- **技術**: Mozilla Readabilityライブラリを使用したコンテンツ抽出
- **カスタムアクション**: 抽出したコンテンツに対してカスタムアクション（変換、整形など）を実行可能

### 2. Markdownビューア

- **パス**: `/authenticated/markdown-viewer`
- **認証**: 必須（Azure AD認証）
- **機能**:
  - 複数Markdownファイルのドラッグ&ドロップ対応
  - リアルタイムプレビュー（デバウンス付き）
  - GitHub Flavored Markdown対応
  - シンタックスハイライト（highlight.js）
  - ファイル順序変更・削除機能
  - 結合コンテンツ表示

### 3. リンクコレクター（Link Collector）

- **パス**: `/link-collector`
- **機能**:
  - 指定URLのページ内からリンクを収集
  - NotebookLM用のフォーマットで出力
  - 除外パターン設定（正規表現対応）
  - 深さ制御（指定階層までのリンク収集）
  - 収集結果の表示・コピー

## 技術スタック

### フロントエンド

- **フレームワーク**: Next.js 14.2.30（App Router）
- **言語**: TypeScript 5.x
- **スタイリング**: Tailwind CSS 3.3.0
- **PWA**: next-pwa 5.6.0（Service Worker、オフライン対応）
- **マークダウン**: react-markdown 10.1.0、remark-gfm、rehype-highlight
- **バリデーション**: Zod 3.24.4
- **Node.js**: 18.17.1（推奨バージョン）

### バックエンド

- **プラットフォーム**: Azure Functions (Node.js 20)
- **コンテンツ抽出**: @mozilla/readability、jsdom
- **API実行環境**: Azure Functions V4（app.tsスタイル）

### テスト

- **E2Eテスト**: Playwright 1.54.1
- **テスト環境**:
  - モックAPIモード（高速テスト）
  - 実際のAPI統合モード
  - SWA CLI認証エミュレーターモード

### 開発ツール

- **Linter**: ESLint（Next.js、Prettier、Security、React Hooks等のプラグイン）
- **ビルドツール**: Next.jsビルドシステム、TypeScript Compiler
- **タスクランナー**: Makefile（開発効率向上）

## プロジェクト構造

```
SwaSnapContent/
├── app/                          # Next.js App Router
│   ├── authenticated/            # 認証が必要なページ
│   │   └── markdown-viewer/      # Markdownビューア
│   ├── components/               # 再利用可能コンポーネント
│   │   ├── auth/                 # 認証関連コンポーネント
│   │   ├── markdown/             # Markdown表示コンポーネント
│   │   ├── thread/               # スレッド機能コンポーネント
│   │   └── ui/                   # UI基盤コンポーネント
│   ├── config/                   # アプリケーション設定
│   ├── contexts/                   # React Context
│   ├── hooks/                    # カスタムフック
│   ├── lib/                      # ユーティリティライブラリ
│   ├── link-collector/           # リンクコレクター機能
│   ├── types/                    # TypeScript型定義
│   ├── url-extractor/            # URL抽出機能
│   └── utils/                    # ユーティリティ関数
├── api/                          # Azure Functions
│   ├── src/
│   │   ├── functions/            # 関数定義
│   │   │   ├── extractContent.ts    # URL本文抽出API
│   │   │   └── collectLinks.ts      # リンク収集API
│   │   ├── models/               # データモデル
│   │   └── index.ts              # エントリーポイント
│   └── dist/                     # ビルド成果物
├── tests/                        # E2Eテスト
│   ├── url-extractor.spec.ts
│   ├── link-collector.spec.ts
│   └── auth-emulator.spec.ts
├── public/                       # 静的アセット
├── out/                          # Next.js静的エクスポート成果物
├── .cursor/                      # Cursor設定
│   └── rules/                    # プロジェクトルール
├── Makefile                      # 開発タスク自動化
├── staticwebapp.config.json      # SWA本番設定
└── swa-cli.config.json           # SWA CLI開発設定
```

## アーキテクチャパターン

### フロントエンド

- **Server Components優先**: デフォルトでServer Componentを使用
- **クライアントコンポーネント最小化**: `'use client'`の使用を最小限に
- **静的エクスポート**: 本番環境では静的サイトとしてビルド（`output: 'export'`）
- **PWA機能**: Service Workerによるキャッシングとオフライン対応

### バックエンド

- **サーバーレス**: Azure Functionsによる完全サーバーレスアーキテクチャ
- **型安全性**: TypeScriptによる完全な型チェック
- **関数型設計**: 関数型プログラミングパターンを採用

### 認証

- **Azure AD統合**: Azure Static Web Appsの認証機能を利用
- **カスタムOpenID Connect**: `swasnapProvider`を使用
- **ロールベースアクセス制御**: `authenticated`ロールで保護ページを制御

## 開発環境のセットアップ

### 前提条件

- Node.js 18.17.1以上
- npm 9以上
- Azure Static Web Apps CLI（統合開発時）

### 初期セットアップ

```bash
# 全依存関係のインストール
make install

# または個別に
npm install
cd api && npm install
```

### 開発サーバー起動

#### フロントエンドのみ

```bash
make dev              # ポートkill付き
make dev-no-kill      # ポートkillなし
```

#### 統合環境（フロントエンド + API）

```bash
make run              # ポートkill付き（推奨）
make run-no-kill      # ポートkillなし
```

#### APIのみ

```bash
make start-api
```

### ビルド

```bash
make build            # 全体ビルド
make build-fe         # フロントエンドのみ
make build-api        # APIのみ
```

## ローカル認証開発

認証が必要なページ（`/authenticated/*`）の開発時は、SWA CLIの認証エミュレーターを使用します。

### 使用方法

1. `make run`で統合環境を起動
2. ブラウザで `http://localhost:4280` にアクセス
3. 認証が必要なページにアクセスすると自動的に認証画面にリダイレクト
4. 認証エミュレーターで任意のユーザー情報を入力：
   - Provider: `aad`（自動設定）
   - User ID: 自動生成またはカスタム
   - Username: 任意（例: `local.dev@example.com`）
   - User's roles: `authenticated`（自動追加）
   - User's claims: JSON形式（任意）

### 認証エンドポイント

- ログイン: `http://localhost:4280/.auth/login/aad`
- ログアウト: `http://localhost:4280/.auth/logout`
- 認証状態確認: `http://localhost:4280/.auth/me`

## テスト戦略

### E2Eテストの種類

#### 1. 通常のE2Eテスト（モックAPI）

```bash
make test-e2e-mock           # ヘッドレス
make test-e2e-mock-headed     # ブラウザ表示あり
```

#### 2. E2Eテスト（API統合）

```bash
make test-e2e                # ヘッドレス
make test-e2e-headed         # ブラウザ表示あり
```

#### 3. 認証テスト（SWA CLI統合）

```bash
make test-auth
```

#### 4. 全テスト実行

```bash
make test                    # 通常テスト + 認証テスト
make test-no-auth            # 通常テストのみ
```

### テスト結果の確認

```bash
# HTMLレポート表示
npx playwright show-report

# テスト結果場所
# - test-results/no-auth/    # 通常テスト
# - test-results/auth/        # 認証テスト
# - playwright-report/       # HTMLレポート
```

## デプロイメント

### Azure Static Web Apps

#### ビルド設定

- **アプリの場所**: `/`（ルート）
- **APIの場所**: `api`
- **出力の場所**: `out`

#### デプロイフロー

1. GitHubリポジトリにプッシュ
2. GitHub Actionsが自動的にビルド・デプロイ
3. 本番環境URLでアクセス可能に

#### 環境変数

本番環境では以下の環境変数が必要：

- `CUSTOM_PROVIDER_CLIENT_ID`: カスタムOIDCプロバイダーのクライアントID
- `CUSTOM_PROVIDER_CLIENT_SECRET_APP_SETTING_NAME`: クライアントシークレット設定名

### ローカルビルド

```bash
# フロントエンドとAPIを両方ビルド
make build

# ビルド成果物
# - out/           # Next.js静的エクスポート
# - api/dist/      # Azure Functionsビルド成果物
```

## 重要な設定ファイル

### Next.js設定 (`next.config.mjs`)

- 静的エクスポート設定（本番時）
- PWA設定（next-pwa）
- 画像最適化無効化（静的エクスポート時）
- Service Workerキャッシング戦略

### Azure Static Web Apps設定 (`staticwebapp.config.json`)

- ルーティング設定
- 認証設定（カスタムOIDCプロバイダー）
- CORS設定
- ナビゲーションフォールバック

### SWA CLI設定 (`swa-cli.config.json`)

- ローカル開発用の認証設定
- 開発環境のカスタマイズ

### TypeScript設定

- `tsconfig.json`: フロントエンド用
- `api/tsconfig.json`: API用

## コーディング規約

### スタイルガイド

詳細は `.cursor/rules/project-rule.mdc` を参照。

#### 主要な原則

1. **関数型プログラミング**: クラスを避け、関数型パターンを採用
2. **Server Components優先**: `'use client'`の使用を最小限に
3. **型安全性**: TypeScriptを徹底的に活用
4. **エラーハンドリング**: 早期リターン、ガード句の使用
5. **命名規則**: 補助動詞を使った説明的な変数名（`isLoading`, `hasError`など）
6. **ディレクトリ名**: 小文字とハイフン（`auth-wizard`など）

### ファイル構造

```
component.tsx              # メインコンポーネント
├── subcomponents          # サブコンポーネント
├── helpers                # ヘルパー関数
├── static content         # 静的コンテンツ
└── types                  # 型定義
```

## 開発ワークフロー

### 機能追加の流れ

1. 要件分析と設計
2. ブランチ作成（`feature/xxx`）
3. 実装
   - コンポーネント作成
   - 必要に応じてAPI関数追加
   - 型定義追加
4. テスト
   - ユニットテスト（将来実装予定）
   - E2Eテスト
5. リント・フォーマット
   ```bash
   make lint-fix
   ```
6. コミット（Conventional Commits + 絵文字）
7. プルリクエスト作成

### トラブルシューティング

#### ポート競合

```bash
make kill-ports            # 使用中ポートをクリア
```

#### API起動エラー

```bash
cd api && npm run build    # 再ビルド
```

#### メモリ制限エラー

```bash
cd api && node --max-old-space-size=4096 $(npm bin)/func start
```

#### 認証エラー

- ブラウザのローカルストレージをクリア
- `make run`で環境変数が正しく設定されているか確認

## パフォーマンス最適化

### フロントエンド

- 静的エクスポートによる高速配信
- Service Workerによるキャッシング
- 画像最適化（将来的に検討）
- コードスプリッティング（Next.js自動）
- デバウンス処理（Markdownパースなど）

### バックエンド

- サーバーレスアーキテクチャによるスケーラビリティ
- タイムアウト設定の最適化
- CORS設定の最適化

## セキュリティ

### 認証

- Azure AD統合認証
- ロールベースアクセス制御
- 認証トークンの安全な管理

### 入力検証

- Zodによるスキーマバリデーション
- XSS対策（Reactの自動エスケープ）
- CSP（Content Security Policy）設定

### API

- CORS設定によるクロスオリジン制御
- 環境変数による機密情報管理

## 今後の拡張予定

- [ ] ユニットテストの追加（Jest + React Testing Library）
- [ ] 画像最適化機能
- [ ] より高度なマークダウン編集機能
- [ ] コンテンツのエクスポート機能拡張
- [ ] 多言語対応（i18n）

## 参考資料

- [Next.js Documentation](https://nextjs.org/docs)
- [Azure Static Web Apps Documentation](https://learn.microsoft.com/azure/static-web-apps/)
- [Azure Functions Documentation](https://learn.microsoft.com/azure/azure-functions/)
- [Playwright Documentation](https://playwright.dev/)
