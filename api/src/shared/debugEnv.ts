// サーバー側のデバッグ環境判定（クライアント app/sansu-100/lib/debug-env.ts と同方針）。
// 本番ドメインからのリクエストではデバッグ用エンドポイントを 403 にするためのガード。
// host は SWA では `x-forwarded-host`、ローカルでは `host` ヘッダから取る。
export function isDebugHost(host: string | null | undefined): boolean {
  const h = (host ?? '').toLowerCase();
  if (!h) return false;
  if (h.startsWith('localhost') || h.startsWith('127.0.0.1')) return true;
  // SWA の PR プレビュー（host に `-<番号>.` を含む azurestaticapps）。本番は false。
  if (h.includes('.azurestaticapps.net') && /-\d+\./.test(h)) return true;
  return false;
}

// 常に管理者として扱うユーザー（本番環境でも算数ゲート等をスキップする）。
// 登録時に発行される固定の userId（rowKey）で判定する。表示名は誰でも自由に
// 登録し直せる自己申告テキストなので識別には使わない。userId はランダムな
// UUID（個人情報ではない不透明な識別子）なので、ソースに直接書いてよい。
const ADMIN_USER_ID = '158e35fa-6b0a-4817-9747-cd6b12b02830';

export function isAdminAccount(user: { rowKey?: string | null }): boolean {
  return user.rowKey === ADMIN_USER_ID;
}
