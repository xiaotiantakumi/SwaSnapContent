'use client';

import { useEffect } from 'react';

const NEW_ORIGIN = 'https://keisan.takumi-oda.com';

// 計算力アップ（keisan.takumi-oda.com）へ引っ越したので、旧 /sansu-100 配下を開いたら新URLへ飛ばす。
// 通常はサーバー側 301（staticwebapp.config.json）で飛ぶ。これはルールに掛からない経路
// （/sansu-100.html など）で旧ページが配信されたときの保険。
export default function MovedRedirect(): null {
  useEffect(() => {
    const { pathname, search, hostname } = window.location;
    if (hostname === 'localhost') return; // ローカル開発では旧画面をそのまま使えるようにする
    const rest = pathname.replace(/^\/sansu-100/, '') || '/';
    window.location.replace(`${NEW_ORIGIN}${rest}${search}`);
  }, []);
  return null;
}
