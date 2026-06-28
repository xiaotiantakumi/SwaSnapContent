import React from 'react';

// ミニゲームの「あそびかた」を intro 画面に出す共通ブロック。
export default function HowToPlay({
  steps,
}: {
  steps: readonly string[];
}): React.JSX.Element {
  return (
    <div className="rounded-xl bg-blue-50 p-4 text-left dark:bg-blue-900/20">
      <p className="mb-2 text-sm font-bold text-blue-800 dark:text-blue-200">
        📖 あそびかた
      </p>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-200">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    </div>
  );
}
