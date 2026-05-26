import { describe, it, expect } from 'vitest';
import { hashPin, verifyPin } from '../pin-hash';

describe('pin-hash', () => {
  it('produces deterministic hash for same pin and salt', async () => {
    const a = await hashPin('1234', 'salt-a');
    const b = await hashPin('1234', 'salt-a');
    expect(a).toBe(b);
  });

  it('produces different hash for different salt', async () => {
    const a = await hashPin('1234', 'salt-a');
    const b = await hashPin('1234', 'salt-b');
    expect(a).not.toBe(b);
  });

  it('produces different hash for different pin', async () => {
    const a = await hashPin('1234', 'salt');
    const b = await hashPin('5678', 'salt');
    expect(a).not.toBe(b);
  });

  it('rejects non-4-digit pins', async () => {
    await expect(hashPin('123', 'salt')).rejects.toThrow();
    await expect(hashPin('12345', 'salt')).rejects.toThrow();
    await expect(hashPin('abcd', 'salt')).rejects.toThrow();
  });

  it('verifyPin returns true for correct pin', async () => {
    const hash = await hashPin('1234', 'salt');
    expect(await verifyPin('1234', 'salt', hash)).toBe(true);
  });

  it('verifyPin returns false for wrong pin', async () => {
    const hash = await hashPin('1234', 'salt');
    expect(await verifyPin('9999', 'salt', hash)).toBe(false);
  });

  it('hex output is 64 chars (SHA-256)', async () => {
    const hash = await hashPin('1234', 'salt');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
