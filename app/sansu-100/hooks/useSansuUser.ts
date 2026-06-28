'use client';

import { useCallback, useEffect, useState } from 'react';

import { sansuApi } from '../lib/api-client';
import { storage } from '../lib/storage';
import type { SansuUserPublic } from '../lib/types';

// サーバー同期はアプリ起動中1回だけ（ユーザーごと）。
const reconciled = new Set<string>();

// 起動時の同期: (1)未送信セッションを再送して取りこぼしコインをサーバーに反映し、
// (2)サーバー権威の残高でローカルを上書き。これで「コインはあるのに参加費が払えない」
// （ローカルだけ多くサーバーは少ない）ズレを解消する。冪等(既送信は409で二重加算なし)。
async function reconcileWithServer(
  id: string,
  apply: (u: SansuUserPublic) => void
): Promise<void> {
  const pending = storage.getPendingSync().filter((s) => s.userId === id);
  for (const s of pending) {
    try {
      const res = await sansuApi.submitSession(s);
      storage.clearPending([s.id]);
      if (res.user) apply(res.user);
    } catch {
      // 送れなければ pending のまま（次回再試行）
    }
  }
  try {
    const server = await sansuApi.getUser(id);
    if (server) apply(server);
  } catch {
    // 取得できなければローカルのまま
  }
}

export function useSansuUser() {
  const [currentUser, setCurrentUser] = useState<SansuUserPublic | null>(null);
  const [recentUsers, setRecentUsers] = useState<SansuUserPublic[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const users = storage.getUsers();
    setRecentUsers(users);
    const id = storage.getCurrentUserId();
    const u = id ? users.find((x) => x.id === id) ?? null : null;
    setCurrentUser(u);
    setLoaded(true);

    if (id && !reconciled.has(id)) {
      reconciled.add(id);
      void reconcileWithServer(id, (fresh) => {
        storage.upsertUser(fresh);
        setRecentUsers(storage.getUsers());
        setCurrentUser((cur) => (cur && cur.id === fresh.id ? fresh : cur));
      });
    }
  }, []);

  const selectUser = useCallback((user: SansuUserPublic | null) => {
    storage.setCurrentUserId(user?.id ?? null);
    setCurrentUser(user);
  }, []);

  const saveUser = useCallback((user: SansuUserPublic) => {
    storage.upsertUser(user);
    setRecentUsers(storage.getUsers());
    setCurrentUser(user);
    storage.setCurrentUserId(user.id);
  }, []);

  const updateUser = useCallback(
    (updater: (u: SansuUserPublic) => SansuUserPublic) => {
      setCurrentUser((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        storage.upsertUser(next);
        setRecentUsers(storage.getUsers());
        return next;
      });
    },
    []
  );

  const removeRecentUser = useCallback(
    (id: string) => {
      storage.removeUser(id);
      setRecentUsers(storage.getUsers());
      if (currentUser?.id === id) {
        storage.setCurrentUserId(null);
        setCurrentUser(null);
      }
    },
    [currentUser?.id]
  );

  const refreshUsers = useCallback(() => {
    const users = storage.getUsers();
    setRecentUsers(users);
    const id = storage.getCurrentUserId();
    const u = id ? users.find((x) => x.id === id) ?? null : null;
    setCurrentUser(u);
  }, []);

  return {
    currentUser,
    recentUsers,
    loaded,
    selectUser,
    saveUser,
    updateUser,
    removeRecentUser,
    refreshUsers,
  };
}
