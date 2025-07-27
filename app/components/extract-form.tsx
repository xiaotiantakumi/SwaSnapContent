'use client';

import { useState, type FormEvent, useEffect } from 'react';

import { type CustomAction, DEFAULT_ACTIONS } from '../config/default-actions';
import { type ArticleOutput } from '../utils/extract-content';

import ActionSelector from './action-selector';
import ArticleDisplay from './article-display';
import CustomActionModal from './custom-action-modal';

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
  const [selectedAction, setSelectedAction] = useState<CustomAction | null>(
    null
  );
  // モーダル編集用の一時的なアクション名とプロンプト（編集時に使用）
  const [editingActionName, setEditingActionName] = useState<
    string | undefined
  >(undefined);
  const [editingActionPrompt, setEditingActionPrompt] = useState<
    string | undefined
  >(undefined);

  // カスタムアクションをロード
  useEffect(() => {
    const loadCustomActions = () => {
      try {
        const storedActionsJson = localStorage.getItem(STORAGE_KEY);
        const storedCustomActions: CustomAction[] = storedActionsJson
          ? JSON.parse(storedActionsJson) as CustomAction[]
          : [];
        // isBuiltIn フラグを確実に false にする (または削除)
        const sanitizedCustomActions = storedCustomActions.map((a) => ({
          name: a.name,
          prompt: a.prompt,
        }));
        setActions([...DEFAULT_ACTIONS, ...sanitizedCustomActions]);
      } catch (e) {
        console.error('カスタムアクションの読み込みに失敗しました:', e);
        setActions([...DEFAULT_ACTIONS]);
      }
    };

    loadCustomActions();
  }, []);

  const getCustomActions = () => actions.filter((a) => !a.isBuiltIn);
  const getAllActionNames = () => new Set(actions.map((a) => a.name));
  const getCustomActionNames = () =>
    new Set(getCustomActions().map((a) => a.name));

  // カスタムアクションを保存 (CustomActionModalから呼び出されるように変更)
  const saveCustomAction = (name: string, prompt: string) => {
    try {
      const customActions = getCustomActions();
      const existingActionIndex = customActions.findIndex(
        (a) => a.name === name
      );

      let updatedCustomActions;
      if (editingActionName && editingActionName !== name) {
        // 名前が変更された編集の場合
        const newNameExists = getCustomActionNames().has(name);
        if (newNameExists) {
          alert(
            `エラー: アクション名 '${name}' は既に存在します。別の名前を入力してください。`
          );
          return;
        }
        // 元の名前のアクションを削除し、新しい名前で追加する扱い
        const filteredActions = customActions.filter(
          (a) => a.name !== editingActionName
        );
        updatedCustomActions = [...filteredActions, { name, prompt }];
      } else if (existingActionIndex !== -1) {
        // 既存アクションの編集 (名前変更なし)
        updatedCustomActions = [...customActions];
        if (existingActionIndex >= 0 && existingActionIndex < updatedCustomActions.length) {
          updatedCustomActions[existingActionIndex] = { name, prompt };
        }
      } else {
        // 新規追加
        if (getAllActionNames().has(name)) {
          // デフォルトアクションも含めて名前の重複チェック
          alert(
            `エラー: アクション名 '${name}' は既に存在します（デフォルトアクションを含む）。別の名前を入力してください。`
          );
          return;
        }
        updatedCustomActions = [...customActions, { name, prompt }];
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustomActions));
      setActions([...DEFAULT_ACTIONS, ...updatedCustomActions]);
      setIsModalOpen(false);
      setEditingActionName(undefined); // 編集状態をリセット
      setEditingActionPrompt(undefined);
    } catch (e) {
      console.error('カスタムアクションの保存/更新に失敗しました:', e);
      alert('カスタムアクションの保存/更新中にエラーが発生しました。');
    }
  };

  // カスタムアクションを削除
  const deleteCustomAction = (nameToDelete: string) => {
    try {
      const updatedCustomActions = getCustomActions().filter(
        (a) => a.name !== nameToDelete
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustomActions));
      setActions([...DEFAULT_ACTIONS, ...updatedCustomActions]);
      if (selectedAction?.name === nameToDelete) {
        setSelectedAction(null);
      }
    } catch (e) {
      console.error('カスタムアクションの削除に失敗しました:', e);
    }
  };

  const handleSelectedActionChange = (actionName: string | null) => {
    if (actionName === null) {
      setSelectedAction(null);
      return;
    }
    const selected = actions.find((a) => a.name === actionName);
    setSelectedAction(selected || null);
  };

  const handleOpenModalForEdit = (action: CustomAction) => {
    if (action.isBuiltIn) return; // デフォルトアクションは編集不可
    setEditingActionName(action.name);
    setEditingActionPrompt(action.prompt);
    setIsModalOpen(true);
  };

  const handleOpenModalForNew = () => {
    setEditingActionName(undefined);
    setEditingActionPrompt(undefined);
    setIsModalOpen(true);
  };

  const handleImportActions = (importedActions: CustomAction[]) => {
    try {
      const currentCustomActions = getCustomActions();
      const defaultActionNames = new Set(DEFAULT_ACTIONS.map((a) => a.name));
      let updatedCount = 0;
      let addedCount = 0;

      const actionsToProcess = importedActions
        .map((action) => ({
          name: action.name.trim(), // 名前をトリム
          prompt: action.prompt,
        }))
        .filter((action) => action.name); // 名前のないアクションは除外

      actionsToProcess.forEach((importedAction) => {
        if (defaultActionNames.has(importedAction.name)) {
          console.warn(
            `デフォルトアクション '${importedAction.name}' は上書きできません。スキップされました。`
          );
          return; // デフォルトアクションは上書きしない
        }

        const existingActionIndex = currentCustomActions.findIndex(
          (a) => a.name === importedAction.name
        );

        if (existingActionIndex !== -1 && existingActionIndex >= 0 && existingActionIndex < currentCustomActions.length) {
          // 既存のカスタムアクションを上書き
          currentCustomActions[existingActionIndex] = importedAction;
          updatedCount++;
        } else {
          // 新しいカスタムアクションとして追加
          currentCustomActions.push(importedAction);
          addedCount++;
        }
      });

      if (
        updatedCount === 0 &&
        addedCount === 0 &&
        importedActions.length > 0
      ) {
        alert(
          'インポートする有効なアクションはありませんでした。デフォルトアクション名と重複しているか、名前が空の可能性があります。'
        );
        return;
      }
      if (importedActions.length === 0) {
        alert('インポートするアクションがファイルに含まれていませんでした。');
        return;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentCustomActions));
      setActions([...DEFAULT_ACTIONS, ...currentCustomActions]);

      let message = '';
      if (addedCount > 0) {
        message += `${addedCount}件の新しいカスタムアクションをインポートしました。\n`;
      }
      if (updatedCount > 0) {
        message += `${updatedCount}件の既存のカスタムアクションを上書きしました。`;
      }
      alert(message.trim());
    } catch (e) {
      console.error('アクションのインポート処理中にエラーが発生しました:', e);
      alert('アクションのインポート処理中にエラーが発生しました。');
    }
  };

  const handleExportAllActions = (): CustomAction[] => {
    // エクスポートする際は isBuiltIn フラグを付与しないか、false にする
    return actions.map(({ name, prompt }) => ({ name, prompt }));
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
    } catch {
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
        const errorData = await response.json() as { error?: string; message?: string };
        // エラーと詳細メッセージの両方を取得して表示
        const errorMessage = errorData.error || 'Unknown error';
        const detailMessage = errorData.message ? `\n${errorData.message}` : '';
        throw new Error(errorMessage + detailMessage);
      }

      const result = await response.json() as unknown;

      if (!result) {
        setError('コンテンツを抽出できませんでした');
        return;
      }

      setArticle(result as typeof article);
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
    if (!article?.textContent) return;

    try {
      // 複数の空白、改行をすべて単一のスペースに置換
      const trimmedContent = article.textContent.replace(/\s+/g, ' ').trim();

      let contentToCopy = trimmedContent;
      if (selectedAction) {
        contentToCopy = `${trimmedContent}\n\n${selectedAction.prompt}`;
      }

      await navigator.clipboard.writeText(contentToCopy);
      setIsPromptCopied(true);
      setTimeout(() => setIsPromptCopied(false), 2000);
    } catch (error) {
      console.error('クリップボードへのコピーに失敗しました:', error);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URLを入力"
            className="grow rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
            disabled={isLoading}
            data-testid="url-input"
          />
          <button
            type="submit"
            className={`rounded-md px-6 py-2 text-white ${
              isLoading
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={isLoading}
            data-testid="extract-button"
          >
            {isLoading ? '抽出中...' : '抽出'}
          </button>
        </div>

        {error ? <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800" data-testid="error-message">
            {error}
          </div> : null}
      </form>

      {article ? <div data-testid="extracted-content">
          {/* 記事表示部分を ArticleDisplay コンポーネントに置き換え */}
          <ArticleDisplay article={article} />

          {/* アクション選択セクション */}
          <ActionSelector
            actions={actions}
            selectedAction={selectedAction}
            onSelectedActionChange={handleSelectedActionChange}
            onActionCopy={handleActionCopy}
            onOpenCustomActionModal={handleOpenModalForNew}
            onDeleteCustomAction={deleteCustomAction}
            isPromptCopied={isPromptCopied}
          />
          {/* 選択中のアクションを編集するボタンを追加 */}
          {selectedAction && !selectedAction.isBuiltIn ? <button
              onClick={() => handleOpenModalForEdit(selectedAction)}
              className="ml-2 mt-2 rounded-md bg-yellow-500 px-3 py-1 text-sm text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700"
            >
              選択中アクションを編集
            </button> : null}
        </div> : null}

      <CustomActionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingActionName(undefined); // モーダルを閉じるときに編集状態をリセット
          setEditingActionPrompt(undefined);
        }}
        onSave={saveCustomAction}
        onImport={handleImportActions}
        onExportAll={handleExportAllActions}
        initialName={editingActionName}
        initialPrompt={editingActionPrompt}
      />
    </div>
  );
}
