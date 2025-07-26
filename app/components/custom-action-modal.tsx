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
}: CustomActionModalProps) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          カスタムアクションの追加・編集
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
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例: この内容について技術的な観点から詳しく説明してください。"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
            ></textarea>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || !prompt.trim()}
              className={`px-4 py-2 rounded-md ${
                !name.trim() || !prompt.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              保存
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t">
          <h4 className="text-md font-semibold mb-3">アクション管理</h4>
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
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
              >
                アクションをインポート (JSON)
              </button>
            </div>
            <button
              onClick={handleExportAllActions}
              className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm"
            >
              すべてのアクションをエクスポート (JSON)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
