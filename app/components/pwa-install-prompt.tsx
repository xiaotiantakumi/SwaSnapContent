'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt(): JSX.Element | null {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };

    const checkInstalled = () => {
      // display-modeがstandaloneの場合、すでにPWAとしてインストール済み
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);
    checkInstalled();

    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  const handleInstallClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    if (!promptInstall) {
      return;
    }
    void promptInstall.prompt();
    void promptInstall.userChoice
      .then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
        }
        return choiceResult;
      })
      .catch((error) => {
        console.error('PWA installation failed:', error);
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
    <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-white p-4 shadow-lg">
      <div className="mb-2 flex items-start justify-between">
        <p className="mr-4 text-sm font-medium">
          このアプリをインストールしますか？
        </p>
        <button
          onClick={handleDismiss}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="閉じる"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-5"
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
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        onClick={handleInstallClick}
      >
        インストール
      </button>
    </div>
  );
}
