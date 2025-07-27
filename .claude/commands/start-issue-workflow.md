---
allowed-tools: ['Bash']
description: 指定されたイシュー番号に基づき、開発準備、プロジェクト分析、実装計画の策定までを自動で行います。
---

あなたのタスク
イシュー番号 $ARGUMENTS に関連する開発作業を開始します。このタスクは、単にブランチを作成するだけでなく、zen-mcp を用いたプロジェクト分析と実装計画の立案までを一貫して行い、開発の第一歩を体系的にセットアップすることを目的とします。

実行計画
開発環境の準備 (Git)

まず、main ブランチに切り替えます。

次に、リモートリポジトリ (origin) から最新の変更を取得し、ローカルの main ブランチを最新の状態に保ちます。

最新の main ブランチをベースに、指定されたイシュー番号 $ARGUMENTS を用いた新しいフィーチャーブランチ (feature/issue-$ARGUMENTS) を作成し、そのブランチに切り替えます。ただし、$ARGUMENTSが長い場合はその短縮した名前をつけて使用してください。

プロジェクト分析と計画策定 (zen-mcp)

zen-mcp を使用してプロジェクト全体を分析し、イシュー $ARGUMENTS を解決するための具体的な実装方針を計画します。

分析・計画の結果を格納するため、tmp/ ディレクトリ配下にイシュー専用のディレクトリ (tmp/issue-$ARGUMENTS) を作成します。

作成したディレクトリ内に plan.md というMarkdownファイルを作成し、zen-mcp による分析結果と実装計画を書き込みます。

完了報告

上記の手順がすべて完了した後、現在のブランチ状況と、生成された計画ファイルのパスを報告し、タスクが完了したことを伝えます。

実行手順
以下のコマンドを順番に実行してください：

Bash

# --- 1. 開発環境の準備 (Git) ---

# メインブランチに切り替え

git checkout main

# 最新の変更をプル

git pull origin main

# 新しいフィーチャーブランチを作成し切り替え

git checkout -b feature/issue-$ARGUMENTS

# --- 2. プロジェクト分析と計画策定 ---

# 計画ファイル用のディレクトリを作成 (-p オプションで親ディレクトリも同時に作成)

mkdir -p tmp/issue-$ARGUMENTS

# zen-mcpでプロジェクトを分析し、結果をplan.mdに保存

# (注: ここでは zen-mcp が分析結果を標準出力に返すことを想定しています)

zen-mcp analyze --issue $ARGUMENTS > tmp/issue-$ARGUMENTS/plan.md

# --- 3. 完了報告 ---

echo "✅ タスク完了"
echo "現在のブランチ: $(git rev-parse --abbrev-ref HEAD)"
echo "実装計画は以下のファイルを確認してください:"
echo "  tmp/issue-$ARGUMENTS/plan.md"

上記の手順を実行した後、plan.md に記載された計画に沿って、実際の実装作業を開始してください。
