'use client';

import { useCallback, useEffect, useState } from 'react';

import { storage } from '../lib/storage';
import type { SansuUserPublic } from '../lib/types';

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
