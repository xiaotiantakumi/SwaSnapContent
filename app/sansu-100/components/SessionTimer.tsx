'use client';

import React, { useEffect, useState } from 'react';

interface SessionTimerProps {
  startedAt: number;
  stopped?: boolean;
}

export default function SessionTimer({
  startedAt,
  stopped,
}: SessionTimerProps): React.JSX.Element {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (stopped) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [stopped]);

  const ms = (stopped ? now : Date.now()) - startedAt;
  const min = Math.floor(ms / 60_000);
  const sec = Math.floor((ms % 60_000) / 1000);
  const tenth = Math.floor((ms % 1000) / 100);
  return (
    <div className="font-mono text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100" data-testid="session-timer">
      {min}:{String(sec).padStart(2, '0')}.{tenth}
    </div>
  );
}

export function formatDuration(ms: number): string {
  const min = Math.floor(ms / 60_000);
  const sec = Math.floor((ms % 60_000) / 1000);
  const tenth = Math.floor((ms % 1000) / 100);
  return `${min}:${String(sec).padStart(2, '0')}.${tenth}`;
}
