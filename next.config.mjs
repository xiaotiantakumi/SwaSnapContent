/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const nextConfig = {
  // Azure Static Web Appsでの動作に必要な設定
  output: 'export',
  distDir: 'out',
  // 画像最適化機能を無効化（静的エクスポート時に必要）
  images: {
    unoptimized: true,
  },
};

const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
};

export default withPWA(pwaConfig)(nextConfig);
