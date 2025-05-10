'use client';

import { useEffect, useState } from 'react';

export default function PWAInstallPrompt() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      console.log('PWAインストールイベントを検知しました。', e);
      setSupportsPWA(true);
      setPromptInstall(e);
    };

    const checkInstalled = () => {
      // display-modeがstandaloneの場合、すでにPWAとしてインストール済み
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    checkInstalled();

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('ユーザーがPWAのインストールを承認しました');
        setIsInstalled(true);
      } else {
        console.log('ユーザーがPWAのインストールを拒否しました');
      }
    });
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // セッション中は表示しないように、セッションストレージに保存
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  useEffect(() => {
    // コンポーネントのマウント時にセッションストレージを確認
    const dismissed = sessionStorage.getItem('pwa-prompt-dismissed') === 'true';
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  if (!supportsPWA || isInstalled || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 z-50">
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-medium mr-4">
          このアプリをインストールしますか？
        </p>
        <button
          onClick={handleDismiss}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="閉じる"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      <button
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        onClick={handleInstallClick}
      >
        インストール
      </button>
    </div>
  );
}
