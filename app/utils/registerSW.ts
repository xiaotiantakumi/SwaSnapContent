'use client';

// WorkboxウィンドウインターフェースのTypeScript型定義
declare global {
  interface Window {
    workbox: {
      addEventListener: (event: string, callback: (event: { isUpdate?: boolean }) => void) => void;
      register: () => void;
    };
  }
}

export function registerServiceWorker() {
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    window.workbox !== undefined
  ) {
    const wb = window.workbox;

    // 新しいService Workerが利用可能になったときの処理
    wb.addEventListener('installed', (event: { isUpdate?: boolean }) => {
      if (event.isUpdate) {
        if (confirm('新しいバージョンが利用可能です。更新しますか？')) {
          window.location.reload();
        }
      }
    });

    // Service Worker登録エラー時の処理
    wb.addEventListener('controlling', () => {
      window.location.reload();
    });

    // 起動
    wb.register();
  }
}
