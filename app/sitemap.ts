import type { MetadataRoute } from 'next';

const BASE_URL = 'https://snap-content.takumi-oda.com';

export const dynamic = 'force-static';

// 公開・インデックス対象の主要ページのみを列挙する。
// ログインやプレイ中などのアプリ状態ページ（/sansu-100/play 等）は含めない。
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-06-30');

  return [
    {
      url: `${BASE_URL}/`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/sansu-100`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/url-extractor`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/link-collector`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];
}
