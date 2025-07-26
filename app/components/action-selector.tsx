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
}: ActionSelectorProps): JSX.Element {
  return (
    <div className="mt-6 rounded-md border border-gray-200 bg-gray-50 p-4">
      <h3 className="mb-3 text-lg font-medium">テキストアクション</h3>
      <p className="mb-3 text-sm text-gray-600">
        選択したアクションを実行すると、整形されたテキストと指定したプロンプトが一緒にコピーされます。
      </p>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:w-64">
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className={`rounded-md px-4 py-2 transition-colors ${
            isPromptCopied
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isPromptCopied ? 'コピーしました！' : 'コピー'}
        </button>

        <button
          onClick={onOpenCustomActionModal}
          className="ml-auto rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
        >
          カスタムアクション
        </button>
      </div>

      {selectedAction ? (
        <div className="mt-3 rounded-md bg-gray-100 p-3">
          <p className="text-sm font-medium">選択中: {selectedAction.name}</p>
          <p className="mt-1 text-sm text-gray-600">{selectedAction.prompt}</p>
          {!selectedAction.isBuiltIn ? (
            <button
              onClick={() => onDeleteCustomAction(selectedAction.name)}
              className="mt-2 text-xs text-red-600 hover:text-red-800"
            >
              このカスタムアクションを削除
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
