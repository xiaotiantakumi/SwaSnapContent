import type { AvatarConfig, SansuSession, SansuUserPublic } from './types';

const BASE = '/api/sansu';

export type CreateUserPayload = {
  name: string;
  avatar: string;
  themeColor: string;
  pinHash: string;
  pinSalt: string;
};

function devAdminHeader(): Record<string, string> {
  if (typeof window === 'undefined' || window.location.hostname !== 'localhost')
    return {};
  const principal = btoa(
    JSON.stringify({
      userId: 'admin-local',
      userRoles: ['authenticated', 'anonymous'],
      identityProvider: 'aad',
      userDetails: 'admin@localhost',
    })
  );
  return { 'x-ms-client-principal': principal };
}

async function jsonFetch<T>(
  url: string,
  init?: RequestInit,
  extraHeaders?: Record<string, string>
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
      ...(extraHeaders ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export const sansuApi = {
  async createUser(payload: CreateUserPayload): Promise<SansuUserPublic> {
    return jsonFetch<SansuUserPublic>(`${BASE}/users`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async findUser(name: string): Promise<SansuUserPublic | null> {
    try {
      return await jsonFetch<SansuUserPublic>(
        `${BASE}/users?name=${encodeURIComponent(name)}`
      );
    } catch (e) {
      if (e instanceof Error && /HTTP 404/.test(e.message)) return null;
      throw e;
    }
  },
  async getUser(userId: string): Promise<SansuUserPublic | null> {
    try {
      return await jsonFetch<SansuUserPublic>(
        `${BASE}/users?userId=${encodeURIComponent(userId)}`
      );
    } catch (e) {
      if (e instanceof Error && /HTTP 404/.test(e.message)) return null;
      throw e;
    }
  },
  async verifyPin(
    userId: string,
    pinHash: string
  ): Promise<{ ok: boolean; user?: SansuUserPublic }> {
    return jsonFetch<{ ok: boolean; user?: SansuUserPublic }>(
      `${BASE}/users/verify`,
      {
        method: 'POST',
        body: JSON.stringify({ userId, pinHash }),
      }
    );
  },
  async submitSession(
    session: SansuSession,
    // ストリークボーナスのコイン計算にサーバーが使う文脈（任意）
    ctx?: { streakDays?: number; prevStreakDays?: number }
  ): Promise<{ ok: true; user?: SansuUserPublic; feverEligible?: boolean }> {
    return jsonFetch<{
      ok: true;
      user?: SansuUserPublic;
      feverEligible?: boolean;
    }>(`${BASE}/sessions`, {
      method: 'POST',
      body: JSON.stringify({ ...session, ...(ctx ?? {}) }),
    });
  },
  // フィーバー達成後のルーレット倍率を適用（サーバーが pending を消費）。
  async claimFever(
    userId: string,
    multiplier: number
  ): Promise<{
    ok?: boolean;
    user?: SansuUserPublic;
    multiplier?: number;
    bonus?: number;
    error?: string;
  }> {
    return jsonFetch(`${BASE}/fever/claim`, {
      method: 'POST',
      body: JSON.stringify({ userId, multiplier }),
    });
  },
  async getSessions(userId: string): Promise<SansuSession[]> {
    return jsonFetch<SansuSession[]>(
      `${BASE}/sessions?userId=${encodeURIComponent(userId)}`
    );
  },
  // アイテム購入・装備。サーバーが残高/所持を検証して更新後の user を返す。
  async purchase(
    userId: string,
    action: 'buy' | 'equip' | 'unequip',
    itemId: string
  ): Promise<{ ok: boolean; user?: SansuUserPublic; error?: string }> {
    try {
      return await jsonFetch<{ ok: boolean; user?: SansuUserPublic }>(
        `${BASE}/purchase`,
        { method: 'POST', body: JSON.stringify({ userId, action, itemId }) }
      );
    } catch (e) {
      // 409（残高不足/未所持）は例外にせず error として返す
      if (e instanceof Error && /HTTP 409/.test(e.message)) {
        return { ok: false, error: 'conflict' };
      }
      throw e;
    }
  },
  // パーツ組み立て式アバターの構成を保存。サーバーが許可値に丸めた user を返す。
  async setAvatarConfig(
    userId: string,
    config: AvatarConfig
  ): Promise<{ ok: boolean; user?: SansuUserPublic; error?: string }> {
    return await jsonFetch<{ ok: boolean; user?: SansuUserPublic }>(
      `${BASE}/avatar`,
      { method: 'POST', body: JSON.stringify({ userId, config }) }
    );
  },
  // ミニゲームの参加費/コンティニュー。残高不足は409→error返し。
  async spend(
    userId: string,
    reason: 'play' | 'continue' | 'dressup'
  ): Promise<{ ok: boolean; user?: SansuUserPublic; error?: string }> {
    try {
      return await jsonFetch<{ ok: boolean; user?: SansuUserPublic }>(
        `${BASE}/spend`,
        { method: 'POST', body: JSON.stringify({ userId, reason }) }
      );
    } catch (e) {
      if (e instanceof Error && /HTTP 409/.test(e.message)) {
        // 算数ゲート(no_plays)と残高不足(insufficient)を区別する。
        const reason = /no_plays/.test(e.message) ? 'no_plays' : 'insufficient';
        return { ok: false, error: reason };
      }
      throw e;
    }
  },
  // デバッグ用: コイン付与（本番ドメインはサーバーが403）。非本番のテスト専用。
  async debugGrant(
    userId: string,
    amount = 1000
  ): Promise<{ ok: boolean; user?: SansuUserPublic; error?: string }> {
    try {
      return await jsonFetch<{ ok: boolean; user?: SansuUserPublic }>(
        `${BASE}/debug-grant`,
        { method: 'POST', body: JSON.stringify({ userId, amount }) }
      );
    } catch (e) {
      if (e instanceof Error && /HTTP 403/.test(e.message)) {
        return { ok: false, error: 'disabled' };
      }
      throw e;
    }
  },
  // ミニゲーム報酬バッジの付与＋最高スコア更新（コイン経済に影響なし）。
  async awardBadge(
    userId: string,
    badgeIds: string[],
    minigameScore?: number,
    gameId?: string
  ): Promise<{ ok: boolean; user?: SansuUserPublic; newRecord?: boolean }> {
    return jsonFetch<{
      ok: boolean;
      user?: SansuUserPublic;
      newRecord?: boolean;
    }>(`${BASE}/award-badge`, {
      method: 'POST',
      body: JSON.stringify({ userId, badgeIds, minigameScore, gameId }),
    });
  },
};

export type AdminUserSummary = SansuUserPublic & {
  totalSessions: number;
};

export const sansuAdminApi = {
  async listUsers(): Promise<AdminUserSummary[]> {
    return jsonFetch<AdminUserSummary[]>(
      `${BASE}/admin/users`,
      undefined,
      devAdminHeader()
    );
  },
  async resetPin(
    userId: string,
    pinHash: string,
    pinSalt: string
  ): Promise<{ ok: true }> {
    return jsonFetch<{ ok: true }>(
      `${BASE}/admin/users/${encodeURIComponent(userId)}/pin`,
      { method: 'PATCH', body: JSON.stringify({ pinHash, pinSalt }) },
      devAdminHeader()
    );
  },
  async getSummary(): Promise<{
    totalUsers: number;
    totalSessions: number;
    sessionsByDate: Record<string, number>;
  }> {
    return jsonFetch(`${BASE}/admin/summary`, undefined, devAdminHeader());
  },
};
