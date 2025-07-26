'use client';

import { useState, useEffect } from 'react';

import { type CustomAction } from '../config/default-actions';

interface CustomActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, prompt: string) => void;
  onImport: (actions: CustomAction[]) => void;
  onExportAll: () => CustomAction[];
  initialName?: string;
  initialPrompt?: string;
}

export default function CustomActionModal({
  isOpen,
  onClose,
  onSave,
  onImport,
  onExportAll,
  initialName = '',
  initialPrompt = '',
}: CustomActionModalProps): JSX.Element | null {
  const [name, setName] = useState(initialName);
  const [prompt, setPrompt] = useState(initialPrompt);

  useEffect(() => {
    setName(initialName);
    setPrompt(initialPrompt);
  }, [initialName, initialPrompt, isOpen]);

  const handleSave = () => {
    if (!name.trim() || !prompt.trim()) return;
    onSave(name.trim(), prompt.trim());
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string')
          throw new Error('File content is not a string.');
        const importedActions = JSON.parse(content) as unknown[];

        if (
          !Array.isArray(importedActions) ||
          !importedActions.every(
            (action): action is { name: string; prompt: string } =>
              typeof action === 'object' &&
              action !== null &&
              'name' in action &&
              'prompt' in action &&
              typeof (action as { name: unknown }).name === 'string' &&
              typeof (action as { prompt: unknown }).prompt === 'string'
          )
        ) {
          throw new Error(
            '無効なアクションフォーマットです。nameとpromptが必要です。'
          );
        }
        const sanitizedActions: CustomAction[] = importedActions.map(
          (action) => ({
            name: (action as { name: string }).name,
            prompt: (action as { prompt: string }).prompt,
          })
        );

        onImport(sanitizedActions);
        alert(
          `${sanitizedActions.length}件のアクションのインポートを試みました。`
        );
        onClose();
      } catch (error) {
        console.error('アクションのインポートに失敗しました:', error);
        alert(
          `アクションのインポートに失敗しました: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExportAllActions = () => {
    const actionsToExport = onExportAll();
    if (actionsToExport.length === 0) {
      alert('エクスポートするアクションがありません。');
      return;
    }
    downloadJson(actionsToExport, 'swasnap-all-actions.json');
  };

  const downloadJson = (data: CustomAction[], filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">
          カスタムアクションの追加・編集
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="action-name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              アクション名
            </label>
            <input
              id="action-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 技術的な説明"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="action-prompt"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              プロンプト内容
            </label>
            <textarea
              id="action-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例: この内容について技術的な観点から詳しく説明してください。"
              className="h-32 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
             />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={onClose}
              className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || !prompt.trim()}
              className={`rounded-md px-4 py-2 ${
                !name.trim() || !prompt.trim()
                  ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              保存
            </button>
          </div>
        </div>

        <div className="mt-6 border-t pt-4">
          <h4 className="mb-3 text-base font-semibold">アクション管理</h4>
          <div className="space-y-3">
            <div>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
                id="import-actions-file"
              />
              <button
                onClick={() =>
                  document.getElementById('import-actions-file')?.click()
                }
                className="w-full rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
              >
                アクションをインポート (JSON)
              </button>
            </div>
            <button
              onClick={handleExportAllActions}
              className="w-full rounded-md bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600"
            >
              すべてのアクションをエクスポート (JSON)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
