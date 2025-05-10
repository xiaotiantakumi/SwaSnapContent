import { z } from 'zod';

/**
 * @mozilla/readabilityの戻り値に合わせたAPI応答のZodスキーマ定義
 * このスキーマはフロントエンドとAPI間の型の一貫性を保つために使用されます
 */
export const ArticleSchema = z.object({
  title: z.string().nullable(),
  content: z.string().default(''),
  textContent: z.string().nullable(),
  length: z.number().default(0),
  excerpt: z.string().nullable(),
  byline: z.string().nullable(),
  dir: z.string().nullable(),
  // langとpublishedTimeはReadabilityから直接は取得できないため、APIで別途メタデータから抽出する必要があります
  lang: z.string().nullable(),
  siteName: z.string().nullable(),
  publishedTime: z.string().nullable(),
});

// APIレスポンスの型定義 - APIとクライアント間で共有される型
export type ArticleOutput = z.infer<typeof ArticleSchema>;
