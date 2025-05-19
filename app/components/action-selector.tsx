'use client';

// 親コンポーネントの CustomAction 型をインポートします。
// 本来は共通の型定義ファイルに移動するのが望ましいです。
import { type CustomAction } from '../config/default-actions';

interface ActionSelectorProps {
  actions: CustomAction[];
  selectedAction: CustomAction | null;
  onSelectedActionChange: (actionName: string | null) => void;
  onActionCopy: () => void;
  onOpenCustomActionModal: () => void;
  onDeleteCustomAction: (actionName: string) => void;
  isPromptCopied: boolean;
}

export default function ActionSelector({
  actions,
  selectedAction,
  onSelectedActionChange,
  onActionCopy,
  onOpenCustomActionModal,
  onDeleteCustomAction,
  isPromptCopied,
}: ActionSelectorProps) {
  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50">
      <h3 className="text-lg font-medium mb-3">テキストアクション</h3>
      <p className="text-sm text-gray-600 mb-3">
        選択したアクションを実行すると、整形されたテキストと指定したプロンプトが一緒にコピーされます。
      </p>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="w-full sm:w-64">
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedAction?.name || ''}
            onChange={(e) => onSelectedActionChange(e.target.value || null)}
          >
            <option value="">アクションを選択</option>
            {actions.map((action) => (
              <option key={action.name} value={action.name}>
                {action.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onActionCopy}
          className={`px-4 py-2 rounded-md transition-colors ${
            isPromptCopied
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isPromptCopied ? 'コピーしました！' : 'コピー'}
        </button>

        <button
          onClick={onOpenCustomActionModal}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md ml-auto"
        >
          カスタムアクション
        </button>
      </div>

      {selectedAction && (
        <div className="mt-3 p-3 bg-gray-100 rounded-md">
          <p className="text-sm font-medium">選択中: {selectedAction.name}</p>
          <p className="text-sm text-gray-600 mt-1">{selectedAction.prompt}</p>
          {!selectedAction.isBuiltIn && (
            <button
              onClick={() => onDeleteCustomAction(selectedAction.name)}
              className="mt-2 text-xs text-red-600 hover:text-red-800"
            >
              このカスタムアクションを削除
            </button>
          )}
        </div>
      )}
    </div>
  );
}
