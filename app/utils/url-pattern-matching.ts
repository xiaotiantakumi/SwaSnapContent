/**
 * URLパターンマッチング用ユーティリティ関数
 * Issue #32: 除外パターン適用時のチェック状態管理問題とターゲットURL自動除外機能
 */

/**
 * URLが除外パターンにマッチするかチェック
 * @param url チェック対象のURL
 * @param patterns 除外パターンの配列
 * @returns マッチした場合true、しなかった場合false
 */
export function isUrlExcluded(url: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    try {
      // 正規表現として解釈を試行
      // eslint-disable-next-line security/detect-non-literal-regexp -- パターンは除外設定から取得される安全な値
      return new RegExp(pattern, 'i').test(url);
    } catch {
      // 正規表現として無効な場合は単純な文字列マッチング
      return url.toLowerCase().includes(pattern.toLowerCase());
    }
  });
}

/**
 * ターゲットURLを正規化して比較
 * URL のバリエーション（http/https、www有無、末尾スラッシュ等）を考慮した比較
 * @param url 比較対象のURL
 * @param targetUrl ターゲットURL
 * @returns 同じURLと判定された場合true、異なる場合false
 */
export function isTargetUrl(url: string, targetUrl: string): boolean {
  try {
    // URLオブジェクトを使用して正規化
    const urlObj = new URL(url);
    const targetObj = new URL(targetUrl);
    
    // プロトコル、ホスト、パス名を比較（末尾スラッシュを統一）
    const normalizePathname = (pathname: string) => {
      return pathname === '/' ? '/' : pathname.replace(/\/$/, '');
    };
    
    return urlObj.protocol === targetObj.protocol &&
           urlObj.host === targetObj.host &&
           normalizePathname(urlObj.pathname) === normalizePathname(targetObj.pathname) &&
           urlObj.search === targetObj.search &&
           urlObj.hash === targetObj.hash;
  } catch {
    // URL解析に失敗した場合は単純な文字列比較
    return url === targetUrl;
  }
}

/**
 * 複数のURLから除外対象を特定
 * @param urls チェック対象のURL配列
 * @param patterns 除外パターンの配列
 * @returns 除外対象のURL配列
 */
export function getExcludedUrls(urls: string[], patterns: string[]): string[] {
  return urls.filter(url => isUrlExcluded(url, patterns));
}

/**
 * URLの正規化
 * @param url 正規化対象のURL
 * @returns 正規化されたURL、失敗時は元のURLを返す
 */
export function normalizeUrl(url: string): string {
  try {
    return new URL(url).href;
  } catch {
    return url;
  }
}