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
// 表示名の一致だけだと同名で誰でも登録できてしまうため、登録済みPINのハッシュも
// あわせて検証する（名前だけでのなりすましを防ぐ）。
// PIN 実値はソースに書かず環境変数 SANSU_ADMIN_PIN で渡す（未設定なら常に不一致＝安全側）。
export const ADMIN_USER_NAME = 'たくみ';

export function isAdminUserName(name: string | null | undefined): boolean {
  return name === ADMIN_USER_NAME;
}

async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${pin}`);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hashBuf);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 管理者アカウントかどうかを名前＋登録済みPINのハッシュ一致で判定する。
 * サーバー側のみで完結する検証（クライアントからPINを送らせる必要はない）。
 */
export async function isAdminAccount(user: {
  name?: string | null;
  pinHash?: string | null;
  pinSalt?: string | null;
}): Promise<boolean> {
  const adminPin = process.env.SANSU_ADMIN_PIN;
  if (!adminPin) return false;
  if (!isAdminUserName(user.name)) return false;
  if (!user.pinHash || !user.pinSalt) return false;
  const expected = await hashPin(adminPin, user.pinSalt);
  return expected === user.pinHash;
}
