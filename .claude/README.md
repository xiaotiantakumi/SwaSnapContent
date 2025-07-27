# Claude Code 設定

このディレクトリには、Claude Code用のプロジェクト設定が含まれています。

## 自動Lintフック

`settings.json`には、ファイル編集後に自動的にESLintを実行するフックが設定されています。

### 環境変数

フックでは以下の環境変数が利用可能です：
- `$CLAUDE_PROJECT_DIR` - プロジェクトのルートディレクトリへの絶対パス
- `$CLAUDE_TOOL_NAME` - 実行されたツール名（Edit、MultiEdit、Write など）
- `$CLAUDE_TOOL_INPUT` - ツールの入力データ（JSON形式）

### 機能

- Claude CodeがTypeScript/JavaScriptファイル（`.ts`, `.tsx`, `.js`, `.jsx`）を編集すると自動的にESLintが実行されます
- ESLintエラーがある場合は、警告が表示されます
- git commitの失敗を事前に防ぐことができます

### 動作の仕組み

1. Claude Codeがファイルを編集（Edit、MultiEdit、Write）
2. PostToolUseフックがトリガーされる
3. `lint-hook.sh`スクリプトが実行される
4. 編集されたファイルに対してESLintが実行される
5. エラーがあれば警告を表示

### フックの無効化

フックを一時的に無効にしたい場合は、`settings.json`の内容をコメントアウトするか、ファイルをリネームしてください。

```bash
# 無効化
mv .claude/settings.json .claude/settings.json.disabled

# 有効化
mv .claude/settings.json.disabled .claude/settings.json
```

### トラブルシューティング

- フックが動作しない場合は、`lint-hook.sh`に実行権限があることを確認してください
- `jq`コマンドがインストールされていることを確認してください（macOSでは `brew install jq`）