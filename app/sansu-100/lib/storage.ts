import type { SansuSession, SansuUserPublic } from './types';

const KEY_CURRENT = 'sansu-100:current-user';
const KEY_USERS = 'sansu-100:users';
const KEY_SESSIONS = (userId: string) => `sansu-100:sessions:${userId}`;
const KEY_SETTINGS = 'sansu-100:settings';
const KEY_PENDING = 'sansu-100:pending-sync';

export type SansuSettings = {
  soundOn: boolean;
  keypadMode: 'on-screen' | 'keyboard' | 'auto';
};

const DEFAULT_SETTINGS: SansuSettings = {
  soundOn: true,
  keypadMode: 'auto',
};

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded — silently drop
  }
}

export const storage = {
  getCurrentUserId(): string | null {
    return safeGet<string | null>(KEY_CURRENT, null);
  },
  setCurrentUserId(id: string | null): void {
    if (id === null) {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(KEY_CURRENT);
      }
      return;
    }
    safeSet(KEY_CURRENT, id);
  },

  getUsers(): SansuUserPublic[] {
    return safeGet<SansuUserPublic[]>(KEY_USERS, []);
  },
  setUsers(users: SansuUserPublic[]): void {
    safeSet(KEY_USERS, users);
  },
  upsertUser(user: SansuUserPublic): void {
    const users = storage.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    storage.setUsers(users);
  },
  removeUser(id: string): void {
    const users = storage.getUsers().filter((u) => u.id !== id);
    storage.setUsers(users);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(KEY_SESSIONS(id));
    }
  },

  getSessions(userId: string): SansuSession[] {
    return safeGet<SansuSession[]>(KEY_SESSIONS(userId), []);
  },
  appendSession(session: SansuSession): void {
    const list = storage.getSessions(session.userId);
    list.push(session);
    // keep last 200 to bound localStorage usage
    const trimmed = list.slice(-200);
    safeSet(KEY_SESSIONS(session.userId), trimmed);
  },

  getSettings(): SansuSettings {
    // 旧形式(一部キー欠落)でも未設定分がDEFAULT_SETTINGSで補われるようマージする
    return {
      ...DEFAULT_SETTINGS,
      ...safeGet<Partial<SansuSettings>>(KEY_SETTINGS, DEFAULT_SETTINGS),
    };
  },
  setSettings(s: SansuSettings): void {
    safeSet(KEY_SETTINGS, s);
  },

  getPendingSync(): SansuSession[] {
    return safeGet<SansuSession[]>(KEY_PENDING, []);
  },
  pushPending(session: SansuSession): void {
    const list = storage.getPendingSync();
    list.push(session);
    safeSet(KEY_PENDING, list);
  },
  clearPending(ids: string[]): void {
    const list = storage.getPendingSync().filter((s) => !ids.includes(s.id));
    safeSet(KEY_PENDING, list);
  },
};
