/**
 * Enhanced Markdown viewer constants
 */

export const DEBOUNCE_DELAY = 300; // milliseconds for markdown parsing debounce

export const DEFAULT_MARKDOWN_CONTENT = `# Markdownビューア

複数のMarkdownファイルをドラッグ&ドロップして始めましょう！

## 機能

- **複数ファイル対応** ドラッグ&ドロップによる読み込み
- **ファイル順序変更** 上下ボタンで順序調整
- **結合コンテンツ表示** ファイル区切り付きで統合表示
- **リアルタイムプレビュー** 遅延更新による快適な表示
- **GitHub Flavored Markdown** 対応
- **シンタックスハイライト** コードブロックの色分け表示
- **レスポンシブデザイン** モバイル・デスクトップ対応
- **クリップボード操作** 簡単なコンテンツ管理

### サポートするファイル形式

- \`.md\` - Markdownファイル
- \`.markdown\` - Markdownファイル（別拡張子）
- \`.txt\` - プレーンテキストファイル

### 使い方

1. **ドラッグ&ドロップ**: 複数のMarkdownファイルをここにドロップ
2. **ファイル選択**: ツールバーからファイルを手動選択
3. **ファイル並び替え**: ↑/↓ボタンでファイル順序を変更
4. **ファイル削除**: ×をクリックして個別ファイルを削除
5. **全て削除**: ツールバーから全ファイルを一括削除

### コード例

\`\`\`typescript
const greeting = (name: string) => {
  return \`こんにちは、\${name}さん！\`;
};

console.log(greeting('世界'));
\`\`\`

### 実装済み機能

- [x] 複数ファイル対応
- [x] ドラッグ&ドロップ機能
- [x] ファイル順序制御
- [x] 結合コンテンツ表示
- [x] 拡張ツールバー
- [x] 統計情報表示

> **ヒント**: ファイルはリストに表示されている順番で結合されます。並び替え機能を使ってコンテンツを整理しましょう！

Markdownファイルをここにドロップして、統合されたプレビューを確認してください。`;

export const SUPPORTED_FILE_EXTENSIONS = ['.md', '.markdown', '.txt'] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit