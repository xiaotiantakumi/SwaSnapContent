# SwaSnapContent Makefile
# 開発効率向上のためのタスク自動化

.PHONY: help install build dev clean test test-e2e test-install test-clean lint start-api start-frontend start-all status deps

# デフォルトターゲット
help:
	@echo "SwaSnapContent 開発コマンド:"
	@echo ""
	@echo "セットアップコマンド:"
	@echo "  make install     - 全依存関係をインストール"
	@echo "  make deps        - 依存関係の状況を確認"
	@echo ""
	@echo "開発コマンド:"
	@echo "  make dev         - フロントエンドの開発サーバーを起動"
	@echo "  make start-api   - Azure Functions APIを起動"
	@echo "  make start-all   - 統合環境を起動 (frontend + API)"
	@echo ""
	@echo "ビルドコマンド:"
	@echo "  make build       - 全体をビルド"
	@echo "  make build-fe    - フロントエンドをビルド"
	@echo "  make build-api   - APIをビルド"
	@echo ""
	@echo "品質チェック・テスト:"
	@echo "  make lint        - リンタを実行"
	@echo "  make lint-fix    - 自動修正可能なリント問題を修正"
	@echo "  make test-install - Playwrightテスト環境をセットアップ"
	@echo "  make test-e2e    - E2Eテストを実行"
	@echo "  make test        - 全テストを実行"
	@echo "  make test-clean  - テスト結果をクリーンアップ"
	@echo ""
	@echo "ユーティリティ:"
	@echo "  make clean       - ビルド成果物を削除"
	@echo "  make status      - プロジェクトの状況確認"

# 依存関係のインストール
install:
	@echo "📦 依存関係をインストール中..."
	npm install
	@echo "📦 API依存関係をインストール中..."
	cd api && npm install
	@echo "✅ 依存関係のインストール完了"

# 依存関係の状況確認
deps:
	@echo "📋 フロントエンド依存関係:"
	npm list --depth=0
	@echo ""
	@echo "📋 API依存関係:"
	cd api && npm list --depth=0

# 開発サーバー起動
dev:
	@echo "🚀 フロントエンド開発サーバーを起動中..."
	npm run dev

# API起動
start-api:
	@echo "🔧 Azure Functions APIを起動中..."
	cd api && npm start

# 統合環境起動
run:
	@echo "🚀 統合環境を起動中..."
	npm run swa:all

# ビルド系コマンド
build: build-api build-fe
	@echo "✅ 全体のビルド完了"

build-fe:
	@echo "🏗️  フロントエンドをビルド中..."
	npm run build

build-api:
	@echo "🏗️  APIをビルド中..."
	cd api && npm run build

# 品質チェック
lint:
	@echo "🔍 リンタを実行中..."
	npm run lint

lint-fix:
	@echo "🔧 リント問題を自動修正中..."
	npm run lint -- --fix

# クリーンアップ
clean:
	@echo "🧹 ビルド成果物を削除中..."
	rm -rf out/
	rm -rf api/dist/
	rm -rf .next/
	@echo "✅ クリーンアップ完了"

# プロジェクト状況確認
status:
	@echo "📊 プロジェクト状況:"
	@echo ""
	@echo "Git状況:"
	git status --short
	@echo ""
	@echo "ブランチ:"
	git branch --show-current
	@echo ""
	@echo "最新コミット:"
	git log --pretty=format:"%h %s" -n 3
	@echo ""
	@echo "ファイル構成:"
	@echo "  フロントエンド: $(shell find app -name '*.tsx' -o -name '*.ts' | wc -l | tr -d ' ') ファイル"
	@echo "  API: $(shell find api/src -name '*.ts' | wc -l | tr -d ' ') ファイル"
	@echo ""
	@echo "ビルド状況:"
	@echo "  フロントエンド: $(if $(wildcard out/),✅ ビルド済み,❌ 未ビルド)"
	@echo "  API: $(if $(wildcard api/dist/),✅ ビルド済み,❌ 未ビルド)"

# リンクコレクター専用コマンド
link-collector-test:
	@echo "🔗 リンクコレクター機能のテスト用コマンド"
	@echo "  フロントエンド: http://localhost:3000/link-collector"
	@echo "  API エンドポイント: http://localhost:7071/api/collectLinks"

# テスト環境のセットアップ
test-install:
	@echo "🎭 Playwrightテスト環境をセットアップ中..."
	npm install --save-dev @playwright/test
	npx playwright install
	@echo "✅ Playwrightテスト環境のセットアップ完了"

# E2Eテストの実行
test-e2e:
	@echo "🎭 E2Eテストを実行中..."
	@echo "📡 アプリケーションサーバーの準備を確認中..."
	npx playwright test
	@echo ""
	@echo "✅ E2Eテスト実行完了"
	@echo ""
	@echo "📊 テスト結果の保存場所:"
	@echo "  📁 テスト結果: test-results/"
	@echo "  📁 HTMLレポート: playwright-report/"
	@echo "  📷 スクリーンショット一覧:"
	@if [ -d "test-results" ]; then \
		find test-results -name "*.png" -exec basename {} \; 2>/dev/null | sort | sed 's/^/    • /' || echo "    (スクリーンショットが見つかりません)"; \
	else \
		echo "    (test-resultsディレクトリが見つかりません)"; \
	fi
	@echo ""
	@echo "🔍 詳細なHTMLレポートを表示するには:"
	@echo "  npx playwright show-report"

# 全テストの実行
test: test-e2e
	@echo ""
	@echo "✅ 全テスト実行完了"
	@echo ""
	@echo "📋 テスト概要:"
	@echo "  • Link Collectorフォーム表示テスト"
	@echo "  • https://takumi-oda.com/blog/ でのリンク収集テスト"
	@echo "  • フォームバリデーションテスト"
	@echo "  • オプションアコーディオンテスト"
	@echo "  • エラーシナリオスクリーンショットテスト"

# テスト結果のクリーンアップ
test-clean:
	@echo "🧹 テスト結果をクリーンアップ中..."
	rm -rf test-results/
	rm -rf playwright-report/
	@echo "✅ テスト結果クリーンアップ完了"

# 開発環境の初期設定
setup: install build
	@echo "🎉 開発環境のセットアップ完了！"
	@echo ""
	@echo "次のステップ:"
	@echo "  make dev         - 開発を開始"
	@echo "  make start-all   - 統合テスト環境で動作確認"
	@echo "  make test-install - E2Eテスト環境のセットアップ"