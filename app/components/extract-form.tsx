'use client';

import { useState, FormEvent, useEffect } from 'react';
import { type ArticleOutput } from '../utils/extract-content';

// カスタムアクションの型定義
interface CustomAction {
  id: string;
  name: string;
  prompt: string;
  isBuiltIn?: boolean;
}

// デフォルトのアクションリスト
const DEFAULT_ACTIONS: CustomAction[] = [
  {
    id: 'summarize',
    name: '要約',
    prompt: 'この内容について、簡潔に要約してください。',
    isBuiltIn: true,
  },
  {
    id: 'bullet-points',
    name: '箇条書きでまとめ',
    prompt: 'この内容について箇条書きでまとめてください。',
    isBuiltIn: true,
  },
  {
    id: 'translate-en',
    name: '英語に翻訳',
    prompt: 'この内容を英語に翻訳してください。',
    isBuiltIn: true,
  },
  {
    id: 'explain-simple',
    name: '簡単に説明',
    prompt: 'この内容を小学生でも理解できるように簡単に説明してください。',
    isBuiltIn: true,
  },
];

// ローカルストレージのキー
const STORAGE_KEY = 'swasnapcontent-custom-actions';

export default function ExtractForm() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<ArticleOutput | null>(null);
  const [isPromptCopied, setIsPromptCopied] = useState(false);

  // カスタムアクション関連の状態
  const [actions, setActions] = useState<CustomAction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newActionName, setNewActionName] = useState('');
  const [newActionPrompt, setNewActionPrompt] = useState('');
  const [selectedAction, setSelectedAction] = useState<CustomAction | null>(
    null
  );

  // カスタムアクションをロード
  useEffect(() => {
    const loadCustomActions = () => {
      try {
        const storedActions = localStorage.getItem(STORAGE_KEY);
        const customActions = storedActions ? JSON.parse(storedActions) : [];
        setActions([...DEFAULT_ACTIONS, ...customActions]);
      } catch (error) {
        console.error('カスタムアクションの読み込みに失敗しました:', error);
        setActions([...DEFAULT_ACTIONS]);
      }
    };

    loadCustomActions();
  }, []);

  // カスタムアクションを保存
  const saveCustomAction = () => {
    if (!newActionName.trim() || !newActionPrompt.trim()) return;

    try {
      // デフォルトアクション以外を取得
      const customActions = actions.filter((action) => !action.isBuiltIn);

      // 新しいアクションを追加
      const newAction: CustomAction = {
        id: `custom-${Date.now()}`,
        name: newActionName.trim(),
        prompt: newActionPrompt.trim(),
      };

      const updatedActions = [...customActions, newAction];

      // ローカルストレージに保存
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedActions));

      // 状態を更新
      setActions([...DEFAULT_ACTIONS, ...updatedActions]);
      setNewActionName('');
      setNewActionPrompt('');
      setIsModalOpen(false);
    } catch (error) {
      console.error('カスタムアクションの保存に失敗しました:', error);
    }
  };

  // カスタムアクションを削除
  const deleteCustomAction = (id: string) => {
    try {
      // 削除対象以外のカスタムアクションを取得
      const customActions = actions
        .filter((action) => !action.isBuiltIn)
        .filter((action) => action.id !== id);

      // ローカルストレージに保存
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customActions));

      // 状態を更新
      setActions([...DEFAULT_ACTIONS, ...customActions]);
    } catch (error) {
      console.error('カスタムアクションの削除に失敗しました:', error);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // バリデーション
    if (!url || !url.trim()) {
      setError('URLを入力してください');
      return;
    }

    // URLの形式をチェック
    try {
      const parsedUrl = new URL(url);
      // HTTP/HTTPSプロトコルに限定
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        setError('HTTPまたはHTTPSのURLを入力してください');
        return;
      }
    } catch (e) {
      setError('有効なURLを入力してください');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setArticle(null);

      // Azure Static Web Apps APIを呼び出す
      // ローカル開発時: /api/extractContent
      // 本番環境: /api/extractContent
      const response = await fetch('/api/extractContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // エラーと詳細メッセージの両方を取得して表示
        throw new Error(
          errorData.error + (errorData.message ? `\n${errorData.message}` : '')
        );
      }

      const result = await response.json();

      if (!result) {
        setError('コンテンツを抽出できませんでした');
        return;
      }

      setArticle(result);
    } catch (error) {
      setError(
        'エラーが発生しました: ' +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 選択したアクションでコンテンツをコピー
  const handleActionCopy = async () => {
    if (!article?.textContent || !selectedAction) return;

    try {
      // 複数の空白、改行をすべて単一のスペースに置換
      const trimmedContent = article.textContent.replace(/\s+/g, ' ').trim();

      // プロンプトを追加したコンテンツを作成
      const contentWithPrompt = `${trimmedContent}\n\n${selectedAction.prompt}`;

      await navigator.clipboard.writeText(contentWithPrompt);
      setIsPromptCopied(true);
      setTimeout(() => setIsPromptCopied(false), 2000);
    } catch (error) {
      console.error('クリップボードへのコピーに失敗しました:', error);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URLを入力"
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`px-6 py-2 text-white rounded-md ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={isLoading}
          >
            {isLoading ? '抽出中...' : '抽出'}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-800">
            {error}
          </div>
        )}
      </form>

      {article && (
        <div className="mt-8 space-y-4">
          {article.title && (
            <h2 className="text-2xl font-semibold">{article.title}</h2>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="text-lg font-medium">抽出されたコンテンツ：</h3>
          </div>

          <div className="p-4 border border-gray-200 rounded-md bg-gray-50 whitespace-pre-wrap h-40 overflow-y-auto">
            {article.textContent || 'テキストコンテンツがありません'}
          </div>

          {/* アクション選択セクション */}
          <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50">
            <h3 className="text-lg font-medium mb-3">テキストアクション</h3>
            <p className="text-sm text-gray-600 mb-3">
              選択したアクションを実行すると、整形されたテキストと指定したプロンプトが一緒にコピーされます。
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="w-full sm:w-64">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedAction?.id || ''}
                  onChange={(e) => {
                    const selected = actions.find(
                      (a) => a.id === e.target.value
                    );
                    setSelectedAction(selected || null);
                  }}
                >
                  <option value="">アクションを選択</option>
                  {actions.map((action) => (
                    <option key={action.id} value={action.id}>
                      {action.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleActionCopy}
                disabled={!selectedAction}
                className={`px-4 py-2 rounded-md transition-colors ${
                  !selectedAction
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isPromptCopied
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isPromptCopied ? 'コピーしました！' : 'コピー'}
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md ml-auto"
              >
                カスタムアクション追加
              </button>
            </div>

            {selectedAction && (
              <div className="mt-3 p-3 bg-gray-100 rounded-md">
                <p className="text-sm font-medium">
                  選択中: {selectedAction.name}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedAction.prompt}
                </p>
                {!selectedAction.isBuiltIn && (
                  <button
                    onClick={() => deleteCustomAction(selectedAction.id)}
                    className="mt-2 text-xs text-red-600 hover:text-red-800"
                  >
                    このカスタムアクションを削除
                  </button>
                )}
              </div>
            )}
          </div>

          {article.siteName && (
            <div className="text-sm text-gray-600">
              サイト名: {article.siteName}
            </div>
          )}

          {article.byline && (
            <div className="text-sm text-gray-600">著者: {article.byline}</div>
          )}
        </div>
      )}

      {/* カスタムアクション追加モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              カスタムアクションの追加
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="action-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  アクション名
                </label>
                <input
                  id="action-name"
                  type="text"
                  value={newActionName}
                  onChange={(e) => setNewActionName(e.target.value)}
                  placeholder="例: 技術的な説明"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="action-prompt"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  プロンプト内容
                </label>
                <textarea
                  id="action-prompt"
                  value={newActionPrompt}
                  onChange={(e) => setNewActionPrompt(e.target.value)}
                  placeholder="例: この内容について技術的な観点から詳しく説明してください。"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
                >
                  キャンセル
                </button>
                <button
                  onClick={saveCustomAction}
                  disabled={!newActionName.trim() || !newActionPrompt.trim()}
                  className={`px-4 py-2 rounded-md ${
                    !newActionName.trim() || !newActionPrompt.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
