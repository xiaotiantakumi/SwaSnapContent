'use client';

import { useCallback, useRef } from 'react';

import { storage } from '../lib/storage';

type SoundType = 'correct' | 'wrong' | 'complete';

function createContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    return new AudioContext();
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainValue = 0.3
): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(gainValue, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

export function useSansuSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback((type: SoundType) => {
    if (!storage.getSettings().soundOn) return;
    if (!ctxRef.current) {
      ctxRef.current = createContext();
    }
    const ctx = ctxRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => null);
    }

    switch (type) {
      case 'correct':
        playTone(ctx, 880, 0.12, 'sine', 0.25);
        setTimeout(() => playTone(ctx, 1100, 0.15, 'sine', 0.2), 80);
        break;
      case 'wrong':
        playTone(ctx, 220, 0.25, 'sawtooth', 0.15);
        break;
      case 'complete':
        playTone(ctx, 660, 0.1, 'sine', 0.25);
        setTimeout(() => playTone(ctx, 880, 0.1, 'sine', 0.25), 110);
        setTimeout(() => playTone(ctx, 1100, 0.25, 'sine', 0.3), 220);
        break;
    }
  }, []);

  return { play };
}
