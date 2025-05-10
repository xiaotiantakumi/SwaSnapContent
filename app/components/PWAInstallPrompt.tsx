'use client';

import { useEffect, useState } from 'react';

export default function PWAInstallPrompt() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

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

  if (!supportsPWA || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 z-50">
      <p className="text-sm font-medium mb-2">
        このアプリをインストールしますか？
      </p>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
        onClick={handleInstallClick}
      >
        インストール
      </button>
    </div>
  );
}
