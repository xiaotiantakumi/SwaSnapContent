'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useThreadManager, ThreadManagerHook } from '../hooks/useThreadManager';

interface ThreadContextValue extends ThreadManagerHook {
  // Additional context-specific methods can be added here if needed
}

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