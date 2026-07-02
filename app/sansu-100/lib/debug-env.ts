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

// 常に管理者として扱うユーザー（本番環境でも算数ゲート等をスキップする）。
// 登録時に発行される固定の userId で判定する（表示名は誰でも登録し直せるため使わない）。
// userId はランダムなUUID（個人情報ではない不透明な識別子）なのでソースに書いてよい。
// サーバー側 api/src/shared/debugEnv.ts の ADMIN_USER_ID と一致させること。
// 実際の権限判定はサーバー側（api/src/shared/debugEnv.ts の isAdminAccount）が行う。
// ここでの判定はUI表示のみに使う補助的なものであり、それ自体はセキュリティ境界ではない。
const ADMIN_USER_ID = '158e35fa-6b0a-4817-9747-cd6b12b02830';

export function isAdminUserId(id: string | null | undefined): boolean {
  return id === ADMIN_USER_ID;
}
