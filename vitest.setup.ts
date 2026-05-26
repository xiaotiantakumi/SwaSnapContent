import '@testing-library/jest-dom/vitest';

if (typeof globalThis.crypto === 'undefined') {
  // jsdom v22+ provides crypto; this is a safety net
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { webcrypto } = require('node:crypto');
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}
