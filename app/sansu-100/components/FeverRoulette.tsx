'use client';

import React, { useEffect, useRef, useState } from 'react';

import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

// ×2/×3 が交互の6分割ルーレット。くるくる回って「とめる！」でタイミングよく止める。
const SEGMENTS = [2, 3, 2, 3, 2, 3];
const N = SEGMENTS.length;
const SEG = 360 / N;

function pt(angleDeg: number, r: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [100 + r * Math.cos(a), 100 + r * Math.sin(a)];
}
function slicePath(i: number): string {
  const [x0, y0] = pt(i * SEG, 92);
  const [x1, y1] = pt((i + 1) * SEG, 92);
  return `M100,100 L${x0},${y0} A92,92 0 0 1 ${x1},${y1} Z`;
}

export default function FeverRoulette({
  onResult,
}: {
  onResult: (multiplier: number) => void;
}): React.JSX.Element {
  const [rotation, setRotation] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [landed, setLanded] = useState<number | null>(null);
  const rotRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const soundRef = useRef(true);

  useEffect(() => {
    soundRef.current = storage.getSettings().soundOn;
    const loop = (t: number) => {
      if (lastRef.current === null) lastRef.current = t;
      const dt = t - lastRef.current;
      lastRef.current = t;
      rotRef.current = (rotRef.current + dt * 0.5) % 360; // 約500度/秒
      setRotation(rotRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const stop = () => {
    if (stopped) return;
    setStopped(true);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const r = ((rotRef.current % 360) + 360) % 360;
    const idx = Math.floor(((360 - r) % 360) / SEG) % N;
    // セグメント中心が上(ポインタ)に来るようスナップ
    const center = idx * SEG + SEG / 2;
    const snapped = (360 - center + 360) % 360;
    rotRef.current = snapped;
    setRotation(snapped);
    const mult = SEGMENTS[idx];
    setLanded(mult);
    if (soundRef.current) sound.fanfare();
    window.setTimeout(() => onResult(mult), 1200);
  };

  return (
    <div
      className="flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br from-orange-100 to-pink-100 p-5 dark:from-orange-900/30 dark:to-pink-900/30"
      data-testid="fever-roulette"
    >
      <p className="text-lg font-extrabold text-orange-700 dark:text-orange-200">
        🔥 フィーバー！ルーレット
      </p>
      <div className="relative size-56">
        <div className="absolute left-1/2 top-[-4px] z-10 -translate-x-1/2 text-3xl leading-none">
          🔻
        </div>
        <svg
          viewBox="0 0 200 200"
          className="size-56 drop-shadow-lg"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: stopped
              ? 'transform 0.4s cubic-bezier(0.2,0.8,0.3,1)'
              : 'none',
          }}
        >
          {SEGMENTS.map((m, i) => {
            const [tx, ty] = pt(i * SEG + SEG / 2, 58);
            return (
              <g key={i}>
                <path
                  d={slicePath(i)}
                  fill={m === 3 ? '#f472b6' : '#fbbf24'}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
                <text
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="24"
                  fontWeight="900"
                  fill="#ffffff"
                >
                  ×{m}
                </text>
              </g>
            );
          })}
          <circle cx="100" cy="100" r="14" fill="#ffffff" />
        </svg>
      </div>
      {landed === null ? (
        <button
          type="button"
          onClick={stop}
          className="rounded-full bg-red-500 px-10 py-3 text-lg font-extrabold text-white shadow-lg hover:bg-red-600 active:scale-95"
          data-testid="roulette-stop"
        >
          とめる！
        </button>
      ) : (
        <p
          className="text-xl font-extrabold text-orange-700 dark:text-orange-200"
          data-testid="roulette-result"
        >
          ×{landed} ！コインが ふえるよ 🎉
        </p>
      )}
    </div>
  );
}
