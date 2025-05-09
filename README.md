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

# 静的ファイルを生成
npm run build

# 統合環境を起動
swa start out --api-location api
```

これにより、http://localhost:4280 でアプリケーション全体（フロントエンド + API）にアクセスできます。

## 本番環境向けビルド

```bash
# フロントエンドのビルド
npm run build

# APIのビルド
cd api && npm run build
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
   cd api && node --max-old-space-size=4096 node_modules/.bin/func start
   ```

5. **「No job functions found」警告**：
   これは HTTP トリガー関数のみを使用している場合は無視して構いません。
