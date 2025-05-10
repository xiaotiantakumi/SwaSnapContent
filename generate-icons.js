const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// アイコンディレクトリの確認と作成
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log(`Created directory: ${iconsDir}`);
}

// 簡単なアイコンを描画してPNGとして保存
function generateIcon(size, filename, color = '#3b82f6') {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 背景を塗る
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  // 円を描画
  const halfSize = size / 2;
  const quarterSize = size / 4;
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(halfSize, halfSize, quarterSize, 0, Math.PI * 2);
  ctx.fill();

  // シンプルな三角形を描画
  ctx.beginPath();
  ctx.moveTo(halfSize - quarterSize / 2, halfSize - quarterSize / 2);
  ctx.lineTo(halfSize + quarterSize / 2, halfSize);
  ctx.lineTo(halfSize - quarterSize / 2, halfSize + quarterSize / 2);
  ctx.closePath();
  ctx.fill();

  // PNGとして保存
  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(iconsDir, filename);
  fs.writeFileSync(filePath, buffer);
  console.log(`Created icon: ${filePath}`);

  return filePath;
}

// スクリーンショットの生成（シンプルな例）
function generateScreenshot(width, height, filename, color = '#3b82f6') {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 背景色
  ctx.fillStyle = '#f9fafb';
  ctx.fillRect(0, 0, width, height);

  // ヘッダー
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, 60);

  // タイトル
  ctx.fillStyle = 'white';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('URL本文抽出アプリ', 20, 35);

  // コンテンツエリア
  ctx.fillStyle = 'white';
  ctx.fillRect(20, 80, width - 40, height - 100);

  // 入力フィールド
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 100, width - 80, 50);

  // ボタン
  ctx.fillStyle = color;
  ctx.fillRect(width - 120, 170, 80, 40);
  ctx.fillStyle = 'white';
  ctx.font = '16px sans-serif';
  ctx.fillText('抽出', width - 100, 195);

  // テキストコンテンツ（プレースホルダー）
  ctx.fillStyle = '#1f2937';
  ctx.font = '16px sans-serif';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(40, 230 + i * 30, width - 80, 2);
  }

  // PNGとして保存
  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(iconsDir, filename);
  fs.writeFileSync(filePath, buffer);
  console.log(`Created screenshot: ${filePath}`);

  return filePath;
}

// すべてのアイコンサイズを生成
console.log('Generating PWA icons...');

// 標準のアイコンを生成
[72, 96, 128, 144, 152, 192, 384, 512].forEach((size) => {
  generateIcon(size, `icon-${size}x${size}.png`);
});

// Apple Touch Icon
generateIcon(180, 'apple-touch-icon.png', '#3b82f6');

// スクリーンショットを生成
console.log('Generating screenshots...');
generateScreenshot(540, 720, 'screenshot-1.png'); // モバイル向け
generateScreenshot(720, 540, 'screenshot-2.png'); // デスクトップ向け

console.log('Done! All PWA assets have been generated.');
