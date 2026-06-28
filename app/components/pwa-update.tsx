'use client';

import React, { useEffect, useState } from 'react';

// 新しいバージョン（Service Worker）が用意できたら知らせるトースト。
// next-pwa(register:true) が自動登録した SW を監視し、更新があれば「こうしん」ボタンを出す。
// タップでリロード＝新バージョンに即切り替わる。アプリを開いたままでも定期チェックで気づける。
export default function PwaUpdate(): React.JSX.Element | null {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const cleanups: Array<() => void> = [];
    let active = true;
    const notify = () => {
      if (active) setReady(true);
    };

    void (async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg || !active) return;

      // すでに待機中の新SWがある（更新が用意済み）
      if (reg.waiting && navigator.serviceWorker.controller) notify();

      // これからインストールされる新SWを監視
      const onUpdateFound = () => {
        const nw = reg.installing;
        if (!nw) return;
        const onState = () => {
          // 既存の制御SWがいる＝初回登録ではなく「更新」
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            notify();
          }
        };
        nw.addEventListener('statechange', onState);
        cleanups.push(() => nw.removeEventListener('statechange', onState));
      };
      reg.addEventListener('updatefound', onUpdateFound);
      cleanups.push(() => reg.removeEventListener('updatefound', onUpdateFound));

      // アプリを開いたまま新版が出ても気づけるよう、定期＋復帰時に更新チェック
      const check = () => {
        void reg.update().catch(() => {});
      };
      const iv = window.setInterval(check, 60_000);
      const onVisible = () => {
        if (document.visibilityState === 'visible') check();
      };
      window.addEventListener('focus', check);
      document.addEventListener('visibilitychange', onVisible);
      cleanups.push(() => window.clearInterval(iv));
      cleanups.push(() => window.removeEventListener('focus', check));
      cleanups.push(() =>
        document.removeEventListener('visibilitychange', onVisible)
      );
    })();

    return () => {
      active = false;
      cleanups.forEach((c) => c());
    };
  }, []);

  if (!ready) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-3 z-[60] flex justify-center px-3"
      data-testid="pwa-update-toast"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-bold text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
        <span>✨ あたらしい バージョンが あります</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-blue-500 px-3 py-1 font-bold text-white hover:bg-blue-600"
          data-testid="pwa-update-reload"
        >
          こうしん
        </button>
        <button
          type="button"
          onClick={() => setReady(false)}
          aria-label="とじる"
          className="rounded-full px-1.5 text-base leading-none opacity-70 hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  );
}
