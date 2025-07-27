# URL 本文抽出アプリ

このアプリケーションは、入力された URL から本文を抽出し表示する静的ホスティングサイトです。Next.js と Azure Functions を使用して構築されています。

## 機能

- URL を入力する欄があります
- URL から本文を抽出し、その内容を入力欄の下に表示します
- 抽出した本文をコピーするボタンがあります

## 技術スタック

- [Next.js](https://nextjs.org/) - React フレームワーク
- [Azure Functions](https://learn.microsoft.com/ja-jp/azure/azure-functions/) - サーバーレス API
- [Tailwind CSS](https://tailwindcss.com/) - スタイリング
- [Mozilla Readability](https://github.com/mozilla/readability) - 本文抽出ライブラリ

## 開発環境のセットアップ

### 前提条件

- Node.js v18 以降
- npm v9 以降
- Azure Static Web Apps CLI（オプション）

### 依存関係のインストール

```bash
# フロントエンド依存関係のインストール
npm install

# APIの依存関係をインストール
cd api && npm install
```

## ローカル開発

### 開発モード

開発中は、Next.js の開発サーバーを使用して作業できます：

```bash
# フロントエンドの開発サーバーを起動
npm run dev
```

このコマンドで開発サーバーが起動し、通常は http://localhost:3000 でアクセスできます。

### API の開発

API を個別に開発・テストする場合：

```bash
# APIディレクトリに移動
cd api

# TypeScriptのビルド
npm run build

# Azure Functionsのローカル実行
npm start
```

### 統合環境での実行

フロントエンドと API を一緒に実行するには、Static Web Apps CLI を使用します：

```bash
# Static Web Apps CLIをインストール（初回のみ）
npm install -g @azure/static-web-apps-cli
```

#### 自動ビルド＆起動（推奨）

```bash
# フロントエンドとAPIを両方ビルドしてから起動
npm run swa:all
```

このコマンド一つで以下の処理が順番に実行されます：

1. フロントエンドのビルド（Next.js アプリケーション）
2. API のビルド（Azure Functions）
3. Static Web Apps CLI の起動

#### 既存のビルドを使用して起動

既にビルド済みの場合は、次のコマンドですぐに起動できます：

```bash
npm run swa:start
```

または、個別にコマンドを実行する場合：

```bash
# 静的ファイルを生成
npm run build

# 統合環境を起動
swa start out --api-location api
```

いずれの方法でも、http://localhost:4280 でアプリケーション全体（フロントエンド + API）にアクセスできます。

### 認証が必要なページのローカル開発

このアプリケーションには `/authenticated/*` の認証が必要なページ（markdown-viewer など）があります。ローカル開発時は SWA CLI の認証エミュレーターを使用します。

#### 認証エミュレーターの使用方法

1. **開発サーバーを起動**:
   ```bash
   npm run swa:all
   # または
   make run
   ```

2. **ブラウザでアクセス**:
   - http://localhost:4280 を開く
   - 認証が必要なページ（例: `/authenticated/markdown-viewer`）にアクセス

3. **認証フロー**:
   - 保護されたページにアクセス時、自動的に認証ページにリダイレクト
   - 認証エミュレーターで任意のユーザー情報を入力:
     - **Provider**: `aad` (自動設定)
     - **User ID**: ランダムに生成（またはカスタム）
     - **Username**: 任意（例: `local.dev@example.com`）
     - **User's roles**: `authenticated` が自動追加
     - **User's claims**: JSON形式（例: `[]` または `[{"typ":"name","val":"Local User"}]`）
   - 認証完了後、markdown-viewer にアクセス可能

4. **手動ログイン/ログアウト**:
   - ログイン: http://localhost:4280/.auth/login/aad
   - ログアウト: http://localhost:4280/.auth/logout
   - 認証状態確認: http://localhost:4280/.auth/me

> **環境変数**: 認証エミュレーターには `AZURE_CLIENT_ID` と `AZURE_CLIENT_SECRET` のダミー値が自動設定され、実際の Azure AD の設定は不要です。

#### 認証設定のカスタマイズ

認証エミュレーターの設定は `swa-cli.config.json` で変更できます：

```json
{
  "configurations": {
    "app": {
      "auth": {
        "identityProviders": {
          "azureActiveDirectory": {
            "userRoles": ["anonymous", "authenticated", "admin"]
          }
        }
      }
    }
  }
}
```

ロールを変更した後は、開発サーバーを再起動してください。

## 本番環境向けビルド

```bash
# フロントエンドのビルド
npm run build

# APIのビルド
cd api && npm run build
```

または、一度に両方をビルドする場合：

```bash
npm run build && npm run build:api
```

ビルドされたフロントエンドファイルは `out` ディレクトリに、API ビルドは `api/dist` ディレクトリに生成されます。

## Azure Static Web Apps へのデプロイ

このプロジェクトは Azure Static Web Apps にデプロイするための設定が含まれています：

1. GitHub リポジトリにコードをプッシュします
2. Azure Portal で新しい Static Web Apps リソースを作成します
3. デプロイ設定で以下を指定します：
   - アプリの場所: `/`
   - API の場所: `api`
   - 出力の場所: `out`

GitHub Actions によって自動的にビルドとデプロイが行われます。

### 本番環境での CORS 設定

本番環境では、セキュリティのために以下の点に注意してください：

- `api/template.local.settings.json` の CORS 設定は開発環境用です
- 本番環境では Azure Static Web Apps の構成で、特定のドメインのみを許可するように CORS を設定してください
- 詳細は [Azure Static Web Apps のドキュメント](https://learn.microsoft.com/ja-jp/azure/static-web-apps/configuration) を参照してください

## 使い方

1. 入力欄に URL を入力します
2. 「抽出」ボタンをクリックします
3. URL からの本文が下部に表示されます
4. 「コピー」ボタンをクリックすると、抽出された本文がクリップボードにコピーされます

## トラブルシューティング

### API 起動時のエラー

API が起動しない場合やエラーが発生する場合は、以下を試してください：

1. **API の再ビルド**：

   ```bash
   cd api && npm run build
   ```

2. **実行中のプロセスを終了**：
   他の Azure Functions プロセスが実行中の場合は終了してください。

3. **ポートが使用中の場合**：
   別のポートを指定して実行してみてください：

   ```bash
   cd api && func start --port 7072
   ```

   その後、別のターミナルで：

   ```bash
   swa start out --api-location api --api-port 7072
   ```

4. **メモリ制限のエラー**：
   大きなウェブページを処理すると、Node.js のメモリ制限に達することがあります。より大きなメモリ制限で実行してみてください：

   ```bash
   # package.jsonのスクリプトを使用する場合（推奨）
   cd api && node --max-old-space-size=4096 $(npm bin)/func start

   # または、グローバルインストールされた場合
   cd api && node --max-old-space-size=4096 func start
   ```

   > 注: `node_modules/.bin/func start` はプロジェクトローカルの Azure Functions Core Tools を直接実行するコマンドです。環境によっては `$(npm bin)/func start` または `npx func start` が推奨されます。

5. **「No job functions found」警告**：
   これは HTTP トリガー関数のみを使用している場合は無視して構いません。
