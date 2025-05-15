// app/config/default-actions.ts

// カスタムアクションの型定義
export interface CustomAction {
  name: string;
  prompt: string;
  isBuiltIn?: boolean;
}

// デフォルトのアクションリスト
export const DEFAULT_ACTIONS: CustomAction[] = [
  {
    name: '要約',
    prompt: 'この内容について、簡潔に要約してください。',
    isBuiltIn: true,
  },
  {
    name: '箇条書きでまとめ',
    prompt: 'この内容について箇条書きでまとめてください。',
    isBuiltIn: true,
  },
  {
    name: '日本語に翻訳',
    prompt: 'この内容を日本語に翻訳してください。',
    isBuiltIn: true,
  },
];
