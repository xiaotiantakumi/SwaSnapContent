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
