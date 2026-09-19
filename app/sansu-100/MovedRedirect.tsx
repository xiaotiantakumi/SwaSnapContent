'use client';

import { useEffect } from 'react';

const NEW_ORIGIN = 'https://keisan.takumi-oda.com';

// 計算力アップ（keisan.takumi-oda.com）へ引っ越したので、旧 /sansu-100 配下を開いたら新URLへ飛ばす。
// 通常はサーバー側 301（staticwebapp.config.json）で飛ぶが、Service Worker に古いページが
// キャッシュされている端末でも確実に移動させるため、クライアントでも同じ遷移をする。
export default function MovedRedirect(): null {
  useEffect(() => {
    const { pathname, search, hostname } = window.location;
    if (hostname === 'localhost') return; // ローカル開発では旧画面をそのまま使えるようにする
    const rest = pathname.replace(/^\/sansu-100/, '') || '/';
    window.location.replace(`${NEW_ORIGIN}${rest}${search}`);
  }, []);
  return null;
}
