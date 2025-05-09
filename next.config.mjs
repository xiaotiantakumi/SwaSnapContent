/** @type {import('next').NextConfig} */
const nextConfig = {
  // Azure Static Web Appsでの動作に必要な設定
  output: 'export',
  distDir: 'out',
  // 画像最適化機能を無効化（静的エクスポート時に必要）
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
