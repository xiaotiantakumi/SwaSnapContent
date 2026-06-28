// 「正規（本番）ドメイン以外」でデバッグ機能を有効にするための判定。
// 有効になるのは: localhost / SWA の PR プレビュー環境（host に `-<番号>.` を含む azurestaticapps）。
// 本番（独自ドメイン、または番号なしの azurestaticapps デフォルトURL）では false。
// `?debug=1` を付けると明示的に有効化もできる。
export function isDebugEnv(): boolean {
  if (typeof window === 'undefined') return false;
  if (new URLSearchParams(window.location.search).get('debug') === '1') {
    return true;
  }
  const h = window.location.hostname.toLowerCase();
  if (h === 'localhost' || h === '127.0.0.1') return true;
  // SWA の PR プレビュー: 例 black-field-00cc2da00-53.eastasia.6.azurestaticapps.net
  if (h.endsWith('.azurestaticapps.net') && /-\d+\./.test(h)) return true;
  return false;
}
