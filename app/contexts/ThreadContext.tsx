'use client';

import { createContext, useContext, type ReactNode } from 'react';

import { useThreadManager, type ThreadManagerHook } from '../hooks/useThreadManager';

type ThreadContextValue = ThreadManagerHook;

const ThreadContext = createContext<ThreadContextValue | null>(null);

interface ThreadProviderProps {
  children: ReactNode;
}

export function ThreadProvider({ children }: ThreadProviderProps) {
  const threadManager = useThreadManager();

  return (
    <ThreadContext.Provider value={threadManager}>
      {children}
    </ThreadContext.Provider>
  );
}

export function useThread(): ThreadContextValue {
  const context = useContext(ThreadContext);
  if (!context) {
    throw new Error('useThread must be used within a ThreadProvider');
  }
  return context;
}