'use client';

import { useEffect } from 'react';

import { sansuApi } from '../lib/api-client';
import { storage } from '../lib/storage';

export function useSansuSync(): void {
  useEffect(() => {
    const flush = async () => {
      const pending = storage.getPendingSync();
      if (pending.length === 0) return;
      const settled: string[] = [];
      for (const s of pending) {
        try {
          await sansuApi.submitSession(s);
          settled.push(s.id);
        } catch {
          // keep in queue
        }
      }
      if (settled.length > 0) storage.clearPending(settled);
    };

    // try once on mount
    flush();

    // and whenever we come back online
    const onOnline = () => {
      flush();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);
}
