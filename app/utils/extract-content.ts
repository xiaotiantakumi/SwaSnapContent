import { z } from 'zod';

// Readabilityの戻り値の構造に合わせた詳細なZodスキーマを定義
export const ArticleSchema = z.object({
  title: z.string().nullable().optional(),
  content: z.string().default(''),
  textContent: z.string().nullable().optional(),
  length: z.number().default(0),
  excerpt: z.string().nullable().optional(),
  byline: z.string().nullable().optional(),
  dir: z.string().nullable().optional(),
  lang: z.string().nullable().optional(),
  siteName: z.string().nullable().optional(),
  publishedTime: z.string().nullable().optional(),
});

// 型とスキーマの互換性を確保するための型
export type ArticleOutput = z.infer<typeof ArticleSchema>;
