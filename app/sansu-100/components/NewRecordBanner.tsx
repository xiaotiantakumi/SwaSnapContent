'use client';

import React, { useEffect } from 'react';

import confetti from 'canvas-confetti';

import { sound } from '../lib/sound-presets';
import { storage } from '../lib/storage';

// 自己ベスト更新のお祝い。マウント時に紙吹雪＋ファンファーレ。
export default function NewRecordBanner({
  score,
}: {
  score: number;
}): React.JSX.Element {
  useEffect(() => {
    const colors = ['#f59e0b', '#fde047', '#fb7185', '#34d399', '#60a5fa'];
    confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 }, colors });
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });
    if (storage.getSettings().soundOn) sound.fanfare();
  }, []);

  return (
    <div className="rounded-xl bg-gradient-to-r from-amber-400 to-pink-500 px-4 py-3 text-center text-lg font-bold text-white shadow">
      🎉 じこベスト こうしん！ {score}
    </div>
  );
}
