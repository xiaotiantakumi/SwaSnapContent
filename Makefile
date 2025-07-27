# SwaSnapContent Makefile
# 開発効率向上のためのタスク自動化

.PHONY: help install build dev dev-no-kill clean test test-e2e test-e2e-headed test-e2e-mock test-e2e-mock-headed test-install test-clean lint start-api start-frontend start-all status deps kill-ports run run-no-kill

# デフォルトターゲット
help:
	@echo "SwaSnapContent 開発コマンド:"
	@echo ""
	@echo "セットアップコマンド:"
	@echo "  make install     - 全依存関係をインストール"
	@echo "  make deps        - 依存関係の状況を確認"
	@echo ""
	@echo "開発コマンド:"
	@echo "  make dev         - フロントエンドの開発サーバーを起動（ポートkill付き）"
	@echo "  make dev-no-kill - フロントエンドの開発サーバーを起動（ポートkillなし）"
	@echo "  make start-api   - Azure Functions APIを起動"
	@echo "  make run         - 統合環境を起動 (frontend + API)（ポートkill付き）"
	@echo "  make run-no-kill - 統合環境を起動（ポートkillなし）"
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
	@echo "  make test-e2e    - E2Eテストを実行（API統合・自動起動）"
	@echo "  make test-e2e-mock - E2Eテストを実行（高速・モックAPI）"
	@echo "  make test-e2e-headed - E2Eテストを実行（ブラウザ表示・API統合）"
	@echo "  make test-e2e-mock-headed - E2Eテストを実行（ブラウザ表示・モックAPI）"
	@echo "  make test        - 全テストを実行"
	@echo "  make test-clean  - テスト結果をクリーンアップ"
	@echo ""
	@echo "ユーティリティ:"
	@echo "  make clean       - ビルド成果物を削除"
	@echo "  make kill-ports  - 使用中のポート（3000,3001,4280,7071,7072）をkill"
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

# 開発サーバー起動（ポートkill付き）
dev: kill-ports
	@echo "🚀 フロントエンド開発サーバーを起動中..."
	@echo "  ⏱️  ポートクリア後、3秒待機..."
	@sleep 3
	npm run dev

# 開発サーバー起動（ポートkillなし）
dev-no-kill:
	@echo "🚀 フロントエンド開発サーバーを起動中..."
	npm run dev

# API起動
start-api:
	@echo "🔧 Azure Functions APIを起動中..."
	cd api && npm start

# ポートを使用中のプロセスをkill
kill-ports:
	@echo "🔪 使用中のポートをkill中..."
	@echo "  🔍 ポート3000の使用プロセスを確認・kill中..."
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "    ポート3000は未使用です"
	@echo "  🔍 ポート3001の使用プロセスを確認・kill中..."
	@lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "    ポート3001は未使用です"
	@echo "  🔍 ポート4280の使用プロセスを確認・kill中..."
	@lsof -ti:4280 | xargs kill -9 2>/dev/null || echo "    ポート4280は未使用です"
	@echo "  🔍 ポート7071の使用プロセスを確認・kill中..."
	@lsof -ti:7071 | xargs kill -9 2>/dev/null || echo "    ポート7071は未使用です"
	@echo "  🔍 ポート7072の使用プロセスを確認・kill中..."
	@lsof -ti:7072 | xargs kill -9 2>/dev/null || echo "    ポート7072は未使用です"
	@echo "✅ ポートkill完了"

# 統合環境起動（ポートkill付き）
run: kill-ports
	@echo "🚀 統合環境を起動中..."
	@echo "  ⏱️  ポートクリア後、3秒待機..."
	@sleep 3
	npm run swa:all

# 統合環境起動（ポートkillなし）
run-no-kill:
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

# 特定のファイルをlint（Claude Codeフックで使用）
lint-file:
	@if [ -z "$(FILE)" ]; then \
		echo "❌ エラー: FILEパラメータが必要です"; \
		echo "使用方法: make lint-file FILE=path/to/file.ts"; \
		exit 1; \
	fi
	@echo "🔍 $(FILE) をリント中..."
	@npx eslint --fix "$(FILE)"

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

# E2Eテストの実行（API統合）
test-e2e: kill-ports
	@echo "🎭 E2Eテストを実行中（API統合）..."
	@echo "🚀 APIサーバーを自動起動してテストを実行します..."
	@echo "  ⏱️  ポートクリア後、3秒待機..."
	@sleep 3
	npm run test:e2e
	@echo ""
	@echo "✅ API統合E2Eテスト実行完了"
	@echo ""
	@echo "📊 テスト結果の保存場所:"
	@echo "  📁 テスト結果: test-results/"
	@echo "  📁 HTMLレポート: playwright-report/"
	@echo ""
	@echo "🔍 詳細なHTMLレポートを表示するには:"
	@echo "  npx playwright show-report"

# モックAPI E2Eテストの実行
test-e2e-mock: kill-ports
	@echo "🎭 E2Eテストを実行中（モックAPI使用）..."
	@echo "📡 アプリケーションサーバーの準備を確認中..."
	@echo "  ⏱️  ポートクリア後、3秒待機..."
	@sleep 3
	npm run test:e2e:mock
	@echo ""
	@echo "✅ モックE2Eテスト実行完了"
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

# ヘッド付きテストの実行（API統合）
test-e2e-headed: kill-ports
	@echo "🎭 E2Eテストを実行中（API統合・ブラウザ表示あり）..."
	@echo "  ⏱️  ポートクリア後、3秒待機..."
	@sleep 3
	npm run test:e2e:headed

# モックAPIヘッド付きテストの実行
test-e2e-mock-headed: kill-ports
	@echo "🎭 E2Eテストを実行中（モックAPI・ブラウザ表示あり）..."
	@echo "  ⏱️  ポートクリア後、3秒待機..."
	@sleep 3
	npm run test:e2e:mock:headed

# 全テストの実行
test: test-e2e
	@echo ""
	@echo "✅ 全テスト実行完了"
	@echo ""
	@echo "📋 テスト概要:"
	@echo "  • Link Collectorフォーム表示テスト"
	@echo "  • https://takumi-oda.com/blog/ でのリンク収集テスト"
	@echo "  • フォームバリデーションテスト"
	@echo "  • 詳細オプション削除確認テスト"
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