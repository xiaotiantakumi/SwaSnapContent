/**
 * 抽出された記事のインターフェース
 * 注意: この型定義はフロントエンドの app/utils/extract-content.ts に定義された
 * ArticleSchema から推論される型と一致させる必要があります。
 * 将来的にはこの型定義を共通パッケージとして切り出すことも検討してください。
 */
export interface Article {
  title: string | null;
  content: string;
  textContent: string | null;
  length: number;
  excerpt: string | null;
  byline: string | null;
  dir: string | null;
  lang: string | null; // HTMLのlang属性から取得
  siteName: string | null;
  publishedTime: string | null; // メタタグから取得
}
