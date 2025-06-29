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

export const NEW_PROJECT_WELCOME_CONTENT = `# 新しいプロジェクトへようこそ！ 🎉

このプロジェクトにMarkdownファイルを追加して作業を始めましょう。

## ファイルを追加する方法

### 1. ツールバーの「+」ボタンをクリック
画面上部のツールバーにある青い「+」ボタンをクリックして、ファイルを選択できます。

### 2. ドラッグ&ドロップ
ファイルを直接この画面にドラッグ&ドロップできます。

### 3. クリップボードから貼り付け
コピーしたMarkdownテキストを緑色の「クリップボード」ボタンで貼り付けできます。

## サポートするファイル

- \`.md\` - Markdownファイル
- \`.markdown\` - Markdownファイル（別拡張子）  
- \`.txt\` - プレーンテキストファイル

## プロジェクトの特徴

✨ **複数ファイル管理** - 関連ファイルをまとめて管理  
📱 **モバイル対応** - スマートフォンでも快適に使用  
🔄 **自動保存** - プロジェクトとファイルは自動的に保存  
🎨 **リアルタイムプレビュー** - 内容をすぐに確認

---

**さあ、最初のファイルを追加してプロジェクトを始めましょう！**`;

export const SUPPORTED_FILE_EXTENSIONS = ['.md', '.markdown', '.txt'] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit