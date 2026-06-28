let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

function playTone(
  freq: number,
  durationMs: number,
  delayMs = 0,
  type: OscillatorType = 'sine',
  volume = 0.2
) {
  const ctx = getCtx();
  if (!ctx) return;
  const start = ctx.currentTime + delayMs / 1000;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + durationMs / 1000);
}

export const sound = {
  correct() {
    playTone(880, 120, 0, 'triangle', 0.15);
  },
  wrong() {
    playTone(200, 200, 0, 'sawtooth', 0.15);
  },
  fanfare() {
    // simple fanfare: C E G C
    [
      [523.25, 0],
      [659.25, 120],
      [783.99, 240],
      [1046.5, 360],
    ].forEach(([f, d]) => playTone(f, 250, d, 'triangle', 0.18));
  },
  // ミニゲーム: food を食べた音
  eat() {
    playTone(660, 90, 0, 'square', 0.14);
  },
  // ミニゲーム: ゲームオーバー（衝突）の音
  crash() {
    playTone(160, 300, 0, 'sawtooth', 0.18);
    playTone(110, 320, 70, 'sawtooth', 0.16);
  },
};
