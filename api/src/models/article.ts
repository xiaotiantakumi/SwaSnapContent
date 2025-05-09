// 抽出された記事のインターフェース
export interface Article {
  title: string | null;
  content: string;
  textContent: string | null;
  length: number;
  excerpt: string | null;
  byline: string | null;
  dir: string | null;
  lang: string | null;
  siteName: string | null;
  publishedTime: string | null;
}
