'use client';

import { useEffect } from 'react';

import { registerServiceWorker } from '../utils/registerSW';

export default function PWAProvider(): null {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
