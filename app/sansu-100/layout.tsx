import type { Metadata } from 'next';

const title = '100マス計算｜無料の計算ドリル・タイム計測アプリ';
const description =
  '足し算・引き算・掛け算の100マス計算を無料でできる学習アプリ。タイムを計測してベスト記録を更新、毎日の計算練習を習慣化できます。スマホ・タブレット・PWA対応で小学生の計算力アップに。';

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  keywords: [
    '100マス計算',
    '百マス計算',
    '計算ドリル',
    '計算練習',
    '足し算',
    '引き算',
    '掛け算',
    '小学生',
    'タイム計測',
    '無料',
  ],
  alternates: {
    canonical: '/sansu-100',
  },
  openGraph: {
    type: 'website',
    url: 'https://snap-content.takumi-oda.com/sansu-100',
    title,
    description,
    siteName: 'snap-content',
    locale: 'ja_JP',
    images: [
      {
        url: '/icons/icon-512x512.png',
        width: 512,
        height: 512,
        alt: '100マス計算',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title,
    description,
    images: ['/icons/icon-512x512.png'],
  },
};

export default function Sansu100Layout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <>{children}</>;
}
